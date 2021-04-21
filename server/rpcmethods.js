'use strict';

let db = require('./db_explanation');
let index = require('./db_index');
let {graph_label: graph} = require('./graph_label');
const {runSPARQL} = require('./graph_label');

const {tic, toc}  = require('./util');

let rpcmethods = {
    templ:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
            });
        }
    },
    getAllDatasets:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
                var datasets = index.getAllDatasets();
                resolve(datasets || {});
            });
        }
    },
    getAllExplanationsByDatasetID:{
        description: ``,
        params: ['datasetID: The id of the dataset'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                var explanations = index.getExplanationsByDatasetID(body.datasetID);
                resolve(explanations || {});
            });
        }
    },
    getAllTestEntities:{
        description: ``,
        params: [],
        returns: ['datasetID:the ID of the dataset', 'explanationID: the ID of the explanation file'],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                var namespace = index.getNamespaceFromDatasetID(body.datasetID)
                var entities = db.getAllTestEntities(body.explanationID);
                graph.addLabelsToEntities(body.datasetID, namespace, entities, (labeled_entities) => {
                    resolve(labeled_entities || {});
                    toc("getAllTestEntities");
                });
            });
        }
    },
    getTasksByCurie:{
        description: ``,
        params: ['explanationID: the ID of the explanation file', 'curie: the curie of the entity'],
        returns: ['all tasks containing entities with the given curie (curie, rel, ?) or (?, rel, curie)'],
        exec(body) {
            return new Promise((resolve) => {
                var tasks = db.getTasksByCurie(body.explanationID, body.curie);
                resolve(tasks || {});
            });
        }
    },
    getTasksByEntityID:{
        description: ``,
        params: ['explanationID: the ID of the explanation file', 'entityID: the internal id of the entity'],
        returns: ['all tasks containing entities with the given id (id, rel, ?) or (?, rel, id)'],
        exec(body) {
            return new Promise((resolve) => {
                var tasks = db.getTasksByEntityID(body.explanationID, body.entityID);
                resolve(tasks || {});
            });
        }
    },
    getTaskByID:{
        description: ``,
        params: ['explanationID: the ID of the explanation file', 'entityID: the internal id of the task'], 
        returns: ['An array of objects with signature (TaskID, EntityID, EntityName, RelationID, RelationName, IsHead)'],
        exec(body) {
            return new Promise((resolve) => {
                var task = db.getTaskByID(body.explanationID, body.entityID);
                resolve(task || {});
            });
        }
    },
    getPredictionsByTaskID:{
        description: ``,
        params: ['datasetID', 'explanationID', 'taskID'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                var predictions = db.getPredictionsByTaskID(body.explanationID, body.taskID);
                var namespace = index.getNamespaceFromDatasetID(body.datasetID);
                graph.addLabelsToPredictions(body.datasetID, namespace, predictions, (labeled_predictions) => {
                    resolve(labeled_predictions || {});
                })
            });
        }
    },
    getInfoByCurie:{
        description: ``,
        params: ['datasetID', 'curie'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                var namespace = index.getNamespaceFromDatasetID(body.datasetID);
                graph.getInfoByCurie(body.datasetID, namespace, body.curie, (res) => {
                    resolve(res || {});
                })
            });
        }
    },
    getInfoByEntityID:{
        description: ``,
        params: ['datasetID', 'explanationID', 'entityID'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                var curie = db.getCurieByEntityID(body.explanationID, body.entityID);
                var namespace = index.getNamespaceFromDatasetID(body.datasetID)
                graph.getInfoByCurie(body.datasetID, namespace, curie, (res) => {
                    resolve(res || {});
                });
            });
        }
    },
    getExplanationsOld:{
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
                var explanation = queries.all(body.dbID, sql);
 
                const variables = ["X", "Y", "A", "B", "C"];
                var entities = new Set();
                var groups = explanation.reduce((groups, item) => {
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
    getExplanations:{
        description: ``,
        params: ['datasetID', 'explanationID', 'taskID', 'entityID'],
        returns: [''],
        exec(body) {
            //body.taskID, body.entityID
            return new Promise((resolve) => {
                tic();
                var explanations = db.getExplanations(body.explanationID, body.taskID, body.entityID);
                var [explanations, variables, entities] = getJson(explanations);
                toc("Rule retrieval and reshape");
                tic();
                var namespace = index.getNamespaceFromDatasetID(body.datasetID)
                graph.addLabelsToExplanations(body.datasetID, namespace, explanations, variables, entities, (labeled_explanations) => {
                    toc("Added labels");
                    resolve(labeled_explanations || {});
                });
            });
        }
    },
};

function getJson(explanations){
    const variables = ["X", "Y", "A", "B", "C"];
    var entities = new Set();
    var groups = explanations.reduce((groups, item) => {
        function splitAtom(atom){
            var relation = atom.substring(0, atom.indexOf('('));
            var head = atom.substring(atom.indexOf('(')+1, atom.indexOf(','));
            var tail = atom.substring(atom.indexOf(',')+1, atom.indexOf(')'));
            return [head, relation, tail];
        }

        var [headStr, bodyStr] = item.RuleDefinition.split(" <= ");
        var [head, relation, tail] = splitAtom(headStr);
        
        
        if(!(variables.includes(head))){
            entities.add(head);
        }
        if(!(variables.includes(tail))){
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
    groups.sort((a,b) => {
        if ( a.Rules[0].Confidence < b.Rules[0].Confidence ){
            return 1;
        }
        if ( a.Rules[0].Confidence > b.Rules[0].Confidence ){
            return -1;
        }
            return 0;
    });
    return [groups, variables, entities];
}

module.exports = rpcmethods;