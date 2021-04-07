'use strict';

let queries = require('./remote_db');
const {runSPARQL} = require('./remote_graph');

const {tic, toc}  = require('./Util');
const util = require('util');

let methods = {
    templ:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
                if (typeof (userObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                
            });
        }
    },
    getAllDatasets:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
                var sql = `select * from dataset;`;
                resolve(queries.all('index', sql) || {});
            });
        }
    },
    getAllExplainationsByDatasetID:{
        description: ``,
        params: [],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                var sql = `select * from explaination where explaination.datasetid = ${body.datasetID};`;
                resolve(queries.all('index', sql) || {});
            });
        }
    },
    getAllTestEntities:{
        description: ``,
        params: [],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                var sql = `
                    select 
                        Namespace
                    from dataset 
                    where dataset.id = ${body.dbID};
                    `;
                var namespace = queries.all('index', sql)[0]["Namespace"];

                var sql = `
                    select 
                        distinct Name, entity.Id 
                    from task 
                    inner join entity on 
                        entity.id = task.EntityID;
                    `;
                var entities = queries.all(body.dbID, sql)

                toc("Entities");
                tic();
                
                var query = `query=
                    SELECT ?subject ?object
                    WHERE {
                        ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object 
                    }
                    `

                runSPARQL(body.dbID, query).then((data) => {
                    toc("Labels");
                    tic();
                    var label_map = {};
                    for(var i = 0; i < data["results"]["bindings"].length; i++){
                        var triple = data["results"]["bindings"][i];
                        label_map[triple["subject"]["value"].replace(namespace, '')] = triple["object"]["value"]
                    }
                    for(var i = 0; i < entities.length; i++){
                        entities[i].Label = label_map[entities[i]["NAME"]];
                    }
                    toc("LabelMap");
                    resolve(entities || {});
                });
                
                
            });
        }
    },
    getTasksByCurie:{
        description: ``,
        params: [],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                var sql = `
                    select 
                        task.ID as TaskID, entity.Id as EntityID, entity.Name as EntityName, relation.Id as RelationID, relation.Name as RelationName, IsHead
                    from task 
                    inner join entity on 
                        entity.id = task.EntityID
                    inner join relation on 
                        relation.id = task.RelationID
                    where entity.Name = '${body.curie}';
                    `
                resolve(queries.all(body.dbID, sql) || {});
            });
        }
    },
    getPredictionsByTaskID:{
        description: ``,
        params: [],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                var sql = `
                    select 
                        entity.Id as EntityID, entity.Name as EntityName, prediction.confidence as Confidence
                    from prediction 
                    inner join entity on 
                        entity.id = prediction.EntityID
                    where prediction.TaskID = ${body.taskID};
                    `;
                var predictions = queries.all(body.dbID, sql);

                toc("Predictions");
                tic();
                var sql = `
                    select 
                        Namespace
                    from dataset 
                    where dataset.id = ${body.dbID};
                    `;
                var namespace = queries.all('index', sql)[0]["Namespace"];
                console.log(namespace);

                var query = `query=
                    prefix ns: <${namespace}>
                    SELECT ?subject ?object
                    WHERE {
                        ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object
                        VALUES ?subject {
                            ${predictions.map((elem)=>{return "ns:" + elem["EntityName"].replace(/\//g,"\\/")}).join(" ")}
                        }
                    }
                    `
                
                runSPARQL(body.dbID, query).then((data) => {
                    toc("Labels");
                    tic();
                    var label_map = {};
                    for(var i = 0; i < data["results"]["bindings"].length; i++){
                        var triple = data["results"]["bindings"][i];
                        label_map[triple["subject"]["value"].replace(namespace, '')] = triple["object"]["value"]
                    }
                    for(var i = 0; i < predictions.length; i++){
                        predictions[i].Label = label_map[predictions[i]["EntityName"]];
                    }
                    toc("LabelMap");
                    resolve(predictions || {});
                });
            });
        }
    },
    getInfoByCurie:{
        description: ``,
        params: [],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                var sql = `
                        select 
                            Namespace
                        from dataset 
                        where dataset.id = ${body.dbID};
                        `;
                var namespace = queries.all('index', sql)[0]["Namespace"];

                var query = `query=
                    SELECT ?predicate ?object
                    WHERE {
                        <${namespace}${body.curie}> ?predicate ?object 
                    }
                    `

                runSPARQL(body.dbID, query).then((data) => {
                    var res = {
                        Label: null,
                        Description: null,
                        Synonyms: null
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
                    resolve(res || {});
                });
            });
        }
    },
    getExplainations:{
        description: ``,
        params: [],
        returns: [''],
        exec(body) {
            //body.taskID, body.entityID
            return new Promise((resolve) => {
                tic();
                var sql = `
                    select 
                        Cluster.ID as ClusterID, 
                        Cluster.Confidence as ClusterConfidence, 
                        Rule.ID as RuleID, 
                        Rule.CONFIDENCE as RuleConfidence, 
                        Rule.DEF as RuleDefinition
                    from cluster 
                    inner join Rule_Cluster on
                        cluster.PredictionTaskId = Rule_Cluster.ClusterPredictionTaskID AND
                        cluster.PredictionEntityId = Rule_Cluster.ClusterPredictionEntityID AND
                        cluster.ID = Rule_Cluster.ClusterID
                    inner join Rule on 
                        Rule.ID = Rule_Cluster.RuleID 
                    where 
                        cluster.PredictionTaskId = ${body.taskID}
                        and cluster.PredictionEntityId = ${body.entityID}
                    ;
                    `;
                var explaination = queries.all(body.dbID, sql);
 
                const variables = ["X", "Y", "A", "B", "C"];
                var entities = new Set();
                var groups = explaination.reduce((groups, item) => {
                    function splitAtom(atom){
                        var relation = atom.substring(0, atom.indexOf('('));
                        var head = atom.substring(atom.indexOf('(')+1, atom.indexOf(','));
                        var tail = atom.substring(atom.indexOf(',')+1, atom.indexOf(')'));
                        return [head, relation, tail];
                    }

                    var [headStr, bodyStr] = item.RuleDefinition.split(" <= ");
                    var [head, relation, tail] = splitAtom(headStr);
                    
                    
                    if(!(variables.includes(head))){
                        console.log(head);
                        console.log(head in ["X"]);
                        entities.add(head);
                    }
                    if(!(variables.includes(tail))){
                        console.log(tail);
                        console.log(tail in ["X"]);
                        entities.add(tail);
                    }
                    
                    var definition = {
                        relation: relation,
                        head: head,
                        tail: tail,
                        bodies: []
                    }
                    
                    bodyStr.split(", ").forEach((element)=> {
                        var [head, relation, tail] = splitAtom(element);
                        if(!(variables.includes(head))){
                            entities.add(head);
                        }
                        if(!(variables.includes(tail))){
                            entities.add(tail);
                        }
                        definition["bodies"].push({
                            relation: relation,
                            head: head,
                            tail: tail
                        })
                    });

                    return {
                      ...groups,
                      [item.ClusterID]: {
                        "ID": item.ClusterID,  
                        "Confidence": item.ClusterConfidence,
                          "Rules": [...(groups[item.ClusterID]?.Rules || []), 
                            {
                              "ID": item.RuleID,
                              "Confidence": item.RuleConfidence,
                              "Definition": definition
                          }
                        ]
                      }
                    }
                }, {});
                groups = Object.values(groups);
                toc("Rule retrieval and reshape");


                tic();
                var sql = `
                    select 
                        Namespace
                    from dataset 
                    where dataset.id = ${body.dbID};
                    `;
                var namespace = queries.all('index', sql)[0]["Namespace"];
                console.log(namespace);
                
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
                runSPARQL(body.dbID, query).then((data) => {
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
                    })
                    toc("LabelMap");
                    resolve(groups || {});
                });
            });
        }
    },
};

module.exports = methods;