'use strict';

const axios = require('axios');
const fs = require('fs');
var FormData = require('form-data');
const {tic, toc, variables}  = require('./util');

//const endpoint = "http://localhost:3030"
const endpoint = "http://localhost:9999/blazegraph"

async function runSPARQL(dbID, query){
    console.log(query)
    var url = `${endpoint}/namespace/${dbID}/sparql`
    var response = await axios({
        method: 'post',
        headers: {"Content-type": "application/x-www-form-urlencoded"},
        url: url,
        data: query
    });
    var data = await response.data;
    return data;
}

function createNewDatasetFuseki(dbID, filepath, rdftype, callback){
    var adm_url = `${endpoint}/$/datasets`;
    var ds_url = `${endpoint}/${dbID}`;
    var ds_created = false;
    console.log("Create");
    axios({
        method: 'post',
        headers: {"Content-type": "application/x-www-form-urlencoded"},
        url: adm_url,
        data: `dbName=${dbID}&dbType=tdb2`
    }).then((response) => {
        console.log(response.status + " Inserted dataset");
        ds_created = true;
        var url = `${ds_url}/data`;
        const form_data = new FormData();
        form_data.append('file', fs.createReadStream(filepath), {contentType: rdftype});
        axios({
            method: 'post',
            url: url,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data
        }).then((response) => {
            console.log(response.status + " Inserted data");
            callback(true);
        }).catch((err) => {
            console.log(err.toJSON());
            cleanup(`${adm_url}/${dbID}`);
            callback(false);
        })
    }).catch((err) => {
        console.log(err);
        if(ds_created){
            cleanup(`${adm_url}/${dbID}`);
        } else {
            console.log("Error when CREATING dataset");
        }
        callback(false);
    });
}

function cleanupFuseki(url){
    axios({
        method: 'delete',
        url: url
    }).then(() => {
        console.log("Error -> Removed Dataset");
    }).catch((err) => {
        console.log(err);
    })
}

function createNewDatasetBlazegraph(dbID, filepath, rdftype, callback){

    var properties = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
        <properties>
        <entry key="com.bigdata.rdf.sail.truthMaintenance">false</entry>
        <entry key="com.bigdata.namespace.${dbID}.lex.com.bigdata.btree.BTree.branchingFactor">400</entry>
        <entry key="com.bigdata.rdf.store.AbstractTripleStore.textIndex">false</entry>
        <entry key="com.bigdata.rdf.store.AbstractTripleStore.justify">false</entry>
        <entry key="com.bigdata.namespace.${dbID}.spo.com.bigdata.btree.BTree.branchingFactor">1024</entry>
        <entry key="com.bigdata.rdf.store.AbstractTripleStore.statementIdentifiers">true</entry>
        <entry key="com.bigdata.rdf.store.AbstractTripleStore.axiomsClass">com.bigdata.rdf.axioms.NoAxioms</entry>
        <entry key="com.bigdata.rdf.sail.namespace">${dbID}</entry>
        <entry key="com.bigdata.rdf.store.AbstractTripleStore.quads">false</entry>
        <entry key="com.bigdata.rdf.store.AbstractTripleStore.geoSpatial">false</entry>
        <entry key="com.bigdata.journal.Journal.groupCommit">false</entry>
        <entry key="com.bigdata.rdf.sail.isolatableIndices">false</entry>
    </properties>`

    var adm_url = `${endpoint}/namespace`;
    var ds_url = `${endpoint}/namespace/${dbID}/sparql`;
    axios({
        method: 'post',
        headers: {"Content-type": "application/xml"},
        url: adm_url,
        data: properties
    }).then((response) => {
        console.log(response.status + " Inserted dataset");

        axios({
            method: 'post',
            url: ds_url,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {"Content-type": "application/x-turtle-RDR"},
            data: fs.createReadStream(filepath)
        }).then((response) => {
            console.log(response.status + " Inserted data");
            callback(true);
        }).catch((err) => {
            console.log(err);
            callback(false);
        })
    }).catch((err) => {
        console.log(err.toJSON());
        callback(false);
    });
}

function cleanupBlazegraph(url){
    axios({
        method: 'delete',
        url: url
    }).then(() => {
        console.log("Error -> Removed Dataset");
    }).catch((err) => {
        console.log(err);
    })
}

let graph_label = {
    addLabelsToEntities(datasetID, namespace, entities, callback){
        var query = `query=
            SELECT ?subject ?object
            WHERE {
                ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object 
            }
            `

        runSPARQL(datasetID, query).then((data) => {
            var label_map = {};
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var triple = data["results"]["bindings"][i];
                label_map[triple["subject"]["value"].replace(namespace, '')] = triple["object"]["value"]
            }
            for(var i = 0; i < entities.length; i++){
                entities[i].Label = label_map[entities[i]["NAME"]];
            }

            
            var query = `query=
            SELECT ?subject ?type
            WHERE {
                ?subject a ?type 
            }
            `
            runSPARQL(datasetID, query).then((data) => {
                var type_map = new Proxy({}, {get(target, name){
                    if(name === "toJSON" || name === "then"){
                        return undefined;
                    } else if(!target.hasOwnProperty(name)){
                        target[name] = []
                    }
                    return target[name]
                }});
                var types = new Set();
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var triple = data["results"]["bindings"][i];
                    type_map[triple["subject"]["value"].replace(namespace, '')].push(triple["type"]["value"])
                }
                for(var i = 0; i < entities.length; i++){
                    type_map[entities[i]["NAME"]].forEach(item => types.add(item))
                    entities[i].Types = type_map[entities[i]["NAME"]];
                }
                callback(entities, Array.from(types).sort());
            });

        });
    },
    addLabelsToPredictions(datasetID, namespace, predictions, callback){
        var query = `query=
            prefix ns: <${namespace}>
            SELECT ?subject ?object
            WHERE {
                ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object
                VALUES ?subject {
                    ${predictions.map((elem)=>{return "ns:" + elem["EntityName"].replace(/\//g,"\\/")}).join(" ")}
                }
            }
            `;
        runSPARQL(datasetID, query).then((data) => {
            var label_map = {};
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var triple = data["results"]["bindings"][i];
                label_map[triple["subject"]["value"].replace(namespace, '')] = triple["object"]["value"]
            }
            for(var i = 0; i < predictions.length; i++){
                predictions[i].Label = label_map[predictions[i]["EntityName"]];
            }
            callback(predictions);
        });
    },
    addLabelsToExplanations(datasetID, namespace, groups, variables, entities, callback){
        var query = `query=
            prefix ns: <${namespace}>
            SELECT ?subject ?object
            WHERE {
                ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object
                VALUES ?subject {
                    ${[...entities].map((elem)=>{return "ns:" + elem.replace(/\//g,"\\/")}).join(" ")}
                }
            }
            `
        runSPARQL(datasetID, query).then((data) => {
            toc("Labels");
            tic();
            var label_map = {};
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var triple = data["results"]["bindings"][i];
                label_map[triple["subject"]["value"].replace(namespace, '')] = triple["object"]["value"]
            }
            groups.forEach((element) => {
                element.Rules.forEach((rule) => {
                    if(!(variables.includes(rule.Definition.head))){
                        rule.Definition.headLabel = label_map[rule.Definition.head];
                    }
                    if(!(variables.includes(rule.Definition.tail))){
                        rule.Definition.tailLabel = label_map[rule.Definition.tail];
                    }
                    rule.Definition.bodies.forEach((body)=>{
                        if(!(variables.includes(body.head))){
                            body.headLabel = label_map[body.head];
                        }
                        if(!(variables.includes(body.tail))){
                            body.tailLabel = label_map[body.tail];
                        }
                    })
                })
            });
            callback(groups);
        });
    },
    getInfoByCurie(datasetID, namespace, curie, callback){
        var query = `query=
            SELECT ?label ?comment
            WHERE {
                <${namespace}${curie}> <http://www.w3.org/2000/01/rdf-schema#label> ?label .
                OPTIONAL {<${namespace}${curie}> <http://www.w3.org/2000/01/rdf-schema#comment> ?comment .}
            }
            `

        runSPARQL(datasetID, query).then((data) => {
            var edge = data["results"]["bindings"][0];
            var res = {
                Label: edge["label"]["value"],
                Description: edge["comment"]["value"],
                Synonyms: [],
                Labels: [],
                Curie: curie
            }

            var query = `query=
            SELECT ?synonym
            WHERE {
                OPTIONAL {<${namespace}${curie}> <http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?synonym .}
            }`
            runSPARQL(datasetID, query).then((data) => {
                console.log(data);
                if(Object.entries(data["results"]["bindings"][0]).length > 0){
                    for(var i = 0; i < data["results"]["bindings"].length; i++){
                        var edge = data["results"]["bindings"][i];
                        res.Synonyms.push(edge["synonym"]["value"]);
                    }
                }

                var query = `query=
                    SELECT ?label
                    WHERE {
                        OPTIONAL {<${namespace}${curie}> a ?label .}
                    }`
                runSPARQL(datasetID, query).then((data) => {
                    if(Object.entries(data["results"]["bindings"][0]).length > 0){
                        for(var i = 0; i < data["results"]["bindings"].length; i++){
                            var edge = data["results"]["bindings"][i];
                            res.Labels.push(edge["label"]["value"]);
                        }
                    }
                    callback(res);
                });
            });
        });
    },
    getOutgoingEdges(datasetID, namespace, curie, callback){
        var res = new Proxy({}, {get(target, name){
            if(name === "toJSON" || name === "then"){
                return undefined;
            } else if(!target.hasOwnProperty(name)){
                target[name] = []
            }
            return target[name]
        }});

        var query = `query=
            PREFIX obl:  <http://ai-strategies.org/ns/>
            SELECT ?predicate ?object ?label
            WHERE {
                <<<${namespace}${curie}> ?predicate ?object>> obl:split obl:train .
                OPTIONAL{ ?object <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
            }
            `
        runSPARQL(datasetID, query).then((data) => {
            console.log(data);
            if(data["results"]["bindings"].length > 0 && Object.entries(data["results"]["bindings"][0]).length > 0){
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var edge = data["results"]["bindings"][i];
                    console.log(edge);
                    res[edge["predicate"]["value"].replace(namespace, '')].push([edge["label"]?.value, edge["object"]["value"].replace(namespace, '')]);
                }   
            }           
            callback(res);
        });
    },
    getIncomingEdges(datasetID, namespace, curie, callback){
        var res = new Proxy({}, {get(target, name){
            if(name === "toJSON" || name === "then"){
                return undefined;
            } else if(!target.hasOwnProperty(name)){
                target[name] = []
            }
            return target[name]
        }});

        var query = `query=
            PREFIX obl:  <http://ai-strategies.org/ns/>
            SELECT ?subject ?predicate ?label
            WHERE {
                <<?subject ?predicate <${namespace}${curie}>>> obl:split obl:train .
                OPTIONAL{ ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
            }
            `
        runSPARQL(datasetID, query).then((data) => {
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var edge = data["results"]["bindings"][i];
                res[edge["predicate"]["value"].replace(namespace, '')].push([edge["label"]["value"], edge["subject"]["value"].replace(namespace, '')]);
            }
            callback(res);
        });
    },
    getInstantiations(datasetID, namespace, head, tail, rule, callback){
        console.log(rule);
        var used_variables = new Set();

        function getEntity(entity){
            if(!variables.includes(entity)){
                return "<" + namespace + entity + ">";
            } else if(entity === "X"){
                return "<" + namespace + head + ">";
            } else if(entity === "Y") {
                return "<" + namespace + tail + ">";
            } else {
                used_variables.add(entity);
                return "?" + entity + "_"
            }
        }
        function getRelation(relation){
            return "<" + namespace + relation + ">";
        }

        var where = "";
        rule.bodies.forEach((element) => {
            where = where + "<<" + getEntity(element.head) + " " + getRelation(element.relation) + " " + getEntity(element.tail) + ">> obl:split obl:train . \n";
        });

        used_variables.forEach((element) => {
            where = where + "?" + element + "_ <http://www.w3.org/2000/01/rdf-schema#label> " + "?" + element + " . \n"
        });

        var query = `query=
            PREFIX obl:  <http://ai-strategies.org/ns/>
            SELECT ${[...used_variables].map(x => "?" + x).join(" ")} ${[...used_variables].map(x => "?" + x + "_").join(" ")}
            WHERE {
                ${where}
            }
        `
        runSPARQL(datasetID, query).then((data) => {
            var res = [];
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var edge = data["results"]["bindings"][i];
                var instantiation = [];
                used_variables.forEach((element) => {
                    var variable = {};
                    variable.variable = element;
                    variable.label = edge[element]["value"];
                    variable.curie = edge[element + "_"]["value"].replace(namespace, '');
                    instantiation.push(variable);
                });
                res.push(instantiation);
            }
            //callback(data["results"]["bindings"])
            callback(res);
        });
    }
}

exports.createNewDatasetFuseki = createNewDatasetFuseki;
exports.createNewDatasetBlazegraph = createNewDatasetBlazegraph;
exports.graph_label = graph_label;