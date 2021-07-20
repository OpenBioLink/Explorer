'use strict';

const axios = require('axios');
const fs = require('fs');
var FormData = require('form-data');
const {tic, toc, variables, logd}  = require('./util');

//const endpoint = "http://localhost:3030"

async function runSPARQL(endpoint, query){
    console.log(query);
    var response = await axios({
        method: 'post',
        setTimeout: 6000,
        headers: {"Content-type": "application/x-www-form-urlencoded"},
        url: endpoint,
        data: query
    });
    var data = await response.data;
    return data;
}

let graph_label = {
    getAllTestEntities(endpoint, namespace, callback){

        var query = `query=
                PREFIX obl:  <http://ai-strategies.org/ns/>
                SELECT ?value ?label (GROUP_CONCAT(?type;SEPARATOR=",") AS ?types)
                WHERE { 
                {
                    SELECT distinct ?value ?label 
                    WHERE {{ 
                    <<?value ?p ?o>> obl:split obl:test .
                    } UNION { 
                    <<?s ?p ?value>> obl:split obl:test .
                    }}
                }
                OPTIONAL{ ?value <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
                OPTIONAL{ ?value a ?type .}
                }
                GROUP BY ?value ?label
            `
        runSPARQL(endpoint, query).then((data) => {
            var entities = data["results"]["bindings"].map((x) => {return {NAME: x["value"]["value"].replace(namespace, ''), Label: x["label"]?.value, Types: x["types"]?.value.split(",")}})
            var query = `query=
                SELECT distinct ?type
                WHERE { 
                ?s a ?type
                }
                ORDER BY ?type
            `
            runSPARQL(endpoint, query).then((data) => {
                var types = data["results"]["bindings"].map((x) => x["type"].value);
                callback(entities, types);
            });
        });
    },
    addLabelsToPredictions(endpoint, namespace, predictions, callback){
        var query = `query=
            SELECT ?subject ?object
            WHERE {
                ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object
                VALUES ?subject {
                    ${predictions.map((elem)=>{return "<" + namespace + elem["EntityName"] + ">"}).join(" ")}
                }
            }
            `;
        runSPARQL(endpoint, query).then((data) => {
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
    addLabelsToExplanations(endpoint, namespace, groups, variables, entities, relations, callback){
        var query = `query=
            SELECT ?subject ?object
            WHERE {
                ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object
                VALUES ?subject {
                    ${[...entities, ...relations].map((elem)=>{return "<" + namespace + elem + ">"}).join(" ")}
                }
            }
            `
        runSPARQL(endpoint, query).then((data) => {
            var label_map = {};
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var triple = data["results"]["bindings"][i];
                label_map[triple["subject"]["value"].replace(namespace, '')] = triple["object"]["value"]
            }
            console.log(label_map);

            groups.forEach((element) => {
                element.Rules.forEach((rule) => {
                    if(!(variables.includes(rule.Definition.head))){
                        rule.Definition.headLabel = label_map[rule.Definition.head];
                    }
                    if(!(variables.includes(rule.Definition.tail))){
                        rule.Definition.tailLabel = label_map[rule.Definition.tail];
                    }
                    rule.Definition.relationLabel = label_map[rule.Definition.relation];
                    console.log(label_map[rule.Definition.relation]);
                    rule.Definition.bodies.forEach((body)=>{
                        if(!(variables.includes(body.head))){
                            body.headLabel = label_map[body.head];
                        }
                        if(!(variables.includes(body.tail))){
                            body.tailLabel = label_map[body.tail];
                        }
                        body.relationLabel = label_map[body.relation];
                    })
                })
            });
            callback(groups);
        });
    },
    getInfoByCurie(endpoint, namespace, curie, callback){
        var query = `query=
            SELECT ?label ?comment ?wwwresource
            WHERE {
                <${namespace}${curie}> <http://www.w3.org/2000/01/rdf-schema#label> ?label .
                OPTIONAL {<${namespace}${curie}> <http://www.w3.org/2000/01/rdf-schema#comment> ?comment .}
                OPTIONAL {<${namespace}${curie}> <http://ai-strategies.org/ns/wwwresource> ?wwwresource .}
            }
            `

        runSPARQL(endpoint, query).then((data) => {

            var edge = data["results"]["bindings"][0];
            var res = {
                Label: edge?.label?.value,
                Description: edge?.comment?.value,
                Synonyms: [],
                Labels: [],
                Curie: curie,
                FullURI: edge?.wwwresource?.value,
            }

            var query = `query=
            SELECT ?synonym
            WHERE {
                OPTIONAL {<${namespace}${curie}> <http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?synonym .}
            }`
            runSPARQL(endpoint, query).then((data) => {
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
                runSPARQL(endpoint, query).then((data) => {
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
    getRelationlabel(endpoint, namespace, relation, callback){
        var query = `query=
            SELECT ?label
            WHERE {
                <${namespace}${relation}> <http://www.w3.org/2000/01/rdf-schema#label> ?label .
            }
            `

        runSPARQL(endpoint, query).then((data) => {
            var edge = data["results"]["bindings"][0];
            var res = {
                Label: edge?.label?.value,
            }
            callback(res);
        });
    },
    addRelationlabelsToTasks(endpoint, namespace, tasks, callback){
        var query = `query=
            SELECT ?subject ?label
            WHERE {
                ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?label .
                VALUES ?subject {
                    ${[...tasks].map((elem)=>{return "<" + namespace + elem.RelationName + ">"}).join(" ")}
                }
            }
            `
        

        runSPARQL(endpoint, query).then((data) => {
            var label_map = {};
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var triple = data["results"]["bindings"][i];
                label_map[triple["subject"]["value"].replace(namespace, '')] = triple["label"]["value"]
            }

            tasks.forEach((task) => {
                task.RelationLabel = label_map[task.RelationName];
            });
            callback(tasks);
        });
    },
    getOutgoingEdges(endpoint, namespace, curie, callback){
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
            SELECT ?predicate ?object ?label ?rellabel
            WHERE {
                <<<${namespace}${curie}> ?predicate ?object>> obl:split obl:train .
                OPTIONAL{ ?object <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
                OPTIONAL{ ?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?rellabel .}
            }
            `
        runSPARQL(endpoint, query).then((data) => {
            if(data["results"]["bindings"].length > 0 && Object.entries(data["results"]["bindings"][0]).length > 0){
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var edge = data["results"]["bindings"][i];
                    res[edge["predicate"]["value"].replace(namespace, '')].push([edge["rellabel"]["value"], edge["label"]?.value, edge["object"]["value"].replace(namespace, '')]);
                }   
            }           
            callback(res);
        });
    },
    getIncomingEdges(endpoint, namespace, curie, callback){
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
            SELECT ?subject ?predicate ?label ?rellabel
            WHERE {
                <<?subject ?predicate <${namespace}${curie}>>> obl:split obl:train .
                OPTIONAL{ ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
                OPTIONAL{ ?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?rellabel .}
            }
            `
        runSPARQL(endpoint, query).then((data) => {
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var edge = data["results"]["bindings"][i];
                res[edge["predicate"]["value"].replace(namespace, '')].push([edge["rellabel"]["value"], edge["label"]["value"], edge["subject"]["value"].replace(namespace, '')]);
            }
            callback(res);
        });
    },
    getInstantiations(endpoint, namespace, head, tail, rule, callback){
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
            where = where + "OPTIONAL { ?" + element + "_ <http://www.w3.org/2000/01/rdf-schema#label> " + "?" + element + " . }\n"
        });

        var query = `query=
            PREFIX obl:  <http://ai-strategies.org/ns/>
            SELECT ${[...used_variables].map(x => "?" + x).join(" ")} ${[...used_variables].map(x => "?" + x + "_").join(" ")}
            WHERE {
                ${where}
            }
        `
        runSPARQL(endpoint, query).then((data) => {
            var res = [];
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var edge = data["results"]["bindings"][i];
                var instantiation = [];
                used_variables.forEach((element) => {
                    var variable = {};
                    variable.variable = element;
                    variable.label = edge[element]?.value;
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

exports.graph_label = graph_label;