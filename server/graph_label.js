'use strict';

const axios = require('axios');
const fs = require('fs');
var FormData = require('form-data');
const {tic, toc}  = require('./util');

const endpoint = "http://localhost:3030"

async function runSPARQL(dbID, query){
    var url = `${endpoint}/${dbID}`
    var response = await axios({
        method: 'post',
        headers: {"Content-type": "application/x-www-form-urlencoded"},
        url: url,
        data: query
    });
    var data = await response.data;
    return data;
}

function createNewDataset(dbID, filepath, rdftype, callback){
    var adm_url = `${endpoint}/$/datasets`;
    var ds_url = `${endpoint}/${dbID}`;
    var ds_created = false;
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
            console.log(err);
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

function cleanup(url){
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
            callback(entities);
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
    addLabelsToExplainations(datasetID, namespace, groups, variables, entities, callback){
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
            SELECT ?predicate ?object
            WHERE {
                <${namespace}${curie}> ?predicate ?object 
            }
            `

        runSPARQL(datasetID, query).then((data) => {
            var res = {
                Label: null,
                Description: null,
                Synonyms: null,
                Curie: curie
            }
            for(var i = 0; i < data["results"]["bindings"].length; i++){
                var edge = data["results"]["bindings"][i];
                if(edge["predicate"]["value"] === "http://www.w3.org/2000/01/rdf-schema#label"){
                    res.Label = edge["object"]["value"];
                } else if(edge["predicate"]["value"] === "http://www.w3.org/2000/01/rdf-schema#comment"){
                    res.Description = edge["object"]["value"];
                } else if(edge["predicate"]["value"] === "http://www.geneontology.org/formats/oboInOwl#hasExactSynonym"){
                    res.Synonyms.push(edge["object"]["value"]);
                }
            }
            callback(res);
        });
    }
}

exports.createNewDataset = createNewDataset;
exports.graph_label = graph_label;