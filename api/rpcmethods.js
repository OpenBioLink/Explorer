'use strict';

let {dbMethods: db} = require('./db');
let {rdfMethods: graph} = require('./rdf');

const {tic, toc, variables, namespace}  = require('./util');

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
    getAllTestEntities:{
        description: ``,
        params: [],
        returns: ['endpoint:the ID of the dataset', 'explanationID: the ID of the explanation file'],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                if(body.endpoint != '' && body.datasetID != 'undefined'){
                    graph.getAllTestEntities(body.endpoint).then((data) => {
                        resolve({entities: data[0], types: data[1]} || {});
                        toc("getAllTestEntities");
                    });
                } else {
                    db.getAllTestEntities(body.datasetID, body.explanationID).then((entities) => {
                        let entities_ = []
                        entities.forEach((row) => {
                            entities_.push([row.NAME, null, 'Entity'])
                        })
                        resolve({entities: entities_, types: ["Entity"]} || {});
                        toc("getAllTestEntities");
                    });
                }
            });
        }
    },
    getTasksByCurie:{
        description: ``,
        params: ['explanationID: the ID of the explanation file', 'curie: the curie of the entity'],
        returns: ['all tasks containing entities with the given curie (curie, rel, ?) or (?, rel, curie)'],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                db.getTasksByCurie(body.datasetID, body.explanationID, body.curie).then((tasks) => {
                    return graph.addRelationlabelsToTasks(body.endpoint, tasks);
                }).then((tasks) => {
                    resolve(tasks || {});
                });
            });
        }
    },
    getTaskByID:{
        description: ``,
        params: ['explanationID: the ID of the explanation file', 'entityID: the internal id of the task'], 
        returns: ['An array of objects with signature (TaskID, EntityID, EntityName, RelationID, RelationName, IsHead)'],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                var task = null;
                db.getTaskByID(body.datasetID, body.explanationID, body.entityID).then((task_) => {
                    task = task_;
                    return graph.getRelationlabel(body.endpoint, task.RelationName);
                }).then((RelationLabel) => {
                    task.RelationLabel = RelationLabel.Label;
                    toc("getTaskByID");
                    resolve(task || {});
                });
            });
        }
    },
    getPredictionsByTaskID:{
        description: ``,
        params: ['datasetID', 'explanationID', 'taskID'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                db.getPredictionsByTaskID(body.datasetID, body.explanationID, body.taskID).then((predictions) => {
                    return graph.addLabelsToPredictions(body.endpoint, predictions)
                }).then((labeled_predictions) => {
                    toc("getPredictionsByTaskID");
                    resolve(labeled_predictions || {});
                });
            });
        }
    },
    getPredictionInfo:{
        description: ``,
        params: ['datasetID', 'explanationID', 'taskID', 'entityID'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                var _res = {
                    head: {
                        label: "",
                        curie: ""
                    },
                    rel: "",
                    relLabel: "",
                    tail: {
                        label: "",
                        curie: ""
                    },
                    hit: false,
                    confidence: null
                }

                var taskProm = db.getTaskByID(body.datasetID, body.explanationID, body.taskID);
                var predictionProm = db.getPredictionByID(body.datasetID, body.explanationID, body.taskID, body.entityID);
                Promise.all([taskProm, predictionProm]).then((data) => {
                    var task = data[0];
                    var prediction = data[1];
                    _res["rel"] = task["RelationName"]; 
                    _res["hit"] = prediction["Hit"];
                    _res["confidence"] = prediction["Confidence"];
                    graph.getRelationlabel(body.endpoint, task["RelationName"]).then((relationLabel) => {
                        _res["relLabel"] = relationLabel.Label;
                        return graph.getInfoByCurie(body.endpoint, task["EntityName"]);
                    }).then((taskEntityInfo) => {
                        if(task["IsHead"] == 1){
                            _res["head"]["label"] = taskEntityInfo["Label"] ? taskEntityInfo["Label"] : null
                            _res["head"]["curie"] = task["EntityName"]
                        } else {
                            _res["tail"]["label"] = taskEntityInfo["Label"] ? taskEntityInfo["Label"] : null
                            _res["tail"]["curie"] = task["EntityName"]
                        }
                        return graph.getInfoByCurie(body.endpoint, prediction["EntityName"]);
                    }).then((predictionEntityInfo) => {
                        if(task["IsHead"] == 1){
                            _res["tail"]["label"] = predictionEntityInfo["Label"] ? predictionEntityInfo["Label"] : null
                            _res["tail"]["curie"] = prediction["EntityName"]
                        } else {
                            _res["head"]["label"] = predictionEntityInfo["Label"] ? predictionEntityInfo["Label"] : null
                            _res["head"]["curie"] = prediction["EntityName"]
                        }
                        toc("getPredictionInfo")
                        resolve(_res || {});
                    });
                });
            });
        }
    },
    getInfoByCurie:{
        description: ``,
        params: ['datasetID', 'curie'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                graph.getInfoByCurie(body.endpoint, body.curie).then((res) => {
                    toc("getInfoByCurie");
                    resolve(res || {});
                });
            });
        }
    },
    getInfoByEntityID:{
        description: ``,
        params: ['datasetID', 'explanationID', 'entityID'],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                db.getCurieByEntityID(body.datasetID, body.explanationID, body.entityID).then((curie) => {
                    graph.getInfoByCurie(body.endpoint, curie["NAME"]).then((res) => {
                        resolve(res || {});
                    });
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
                db.getExplanations(body.datasetID, body.explanationID, body.taskID, body.entityID).then((explanations) => {
                    var [explanations, entities, relations] = getJson(explanations);
                    toc("Rule retrieval and reshape");
                    tic();
                    return graph.addLabelsToExplanations(body.endpoint, explanations, variables, entities, relations);
                }).then((labeled_explanations) => {
                    toc("Added labels");
                    resolve(labeled_explanations || {});
                });
            });
        }
    },
    getOutgoingEdges:{
        description: ``,
        params: ['datasetID', 'curie'],
        returns: [''],
        exec(body) {
            //body.taskID, body.entityID
            return new Promise((resolve) => {
                tic();
                graph.getOutgoingEdges(body.endpoint, body.curie).then((outgoing) => {
                    toc("Get outgoing");
                    resolve(outgoing || {});
                });
            });
        }
    },
    getIncomingEdges:{
        description: ``,
        params: ['datasetID', 'curie'],
        returns: [''],
        exec(body) {
            //body.taskID, body.entityID
            return new Promise((resolve) => {
                tic();
                graph.getIncomingEdges(body.endpoint, body.curie).then((incoming) => {
                    toc("Get incoming");
                    resolve(incoming || {});
                });
            });
        }
    },
    getInstantiations:{
        description: ``,
        params: ['datasetID', 'explanationID', 'ruleID', 'head', 'tail'],
        returns: [''],
        exec(body) {
            //body.taskID, body.entityID
            return new Promise((resolve) => {
                tic();
                db.getRuleByID(body.datasetID, body.explanationID, body.ruleID).then((rule) => {
                    var def = splitRule(rule["DEF"]);
                    return graph.getInstantiations(body.endpoint, body.head, body.tail, def);
                }).then((instantiations) => {
                    resolve(instantiations || {});
                });
                toc("Instantiation");
            });
        }
    },
};

function splitAtom(atom){
    var relation = atom.substring(0, atom.indexOf('('));
    var head = atom.substring(atom.indexOf('(')+1, atom.indexOf(','));
    var tail = atom.substring(atom.indexOf(',')+1, atom.indexOf(')'));
    return [head, relation, tail];
}

function splitRule(ruleStr, entities, relations){

    var def = {
        relation: null,
        head: null,
        tail: null,
        hasUnboundVariables: false,
        bodies: []
    }

    var [headStr, bodyStr] = ruleStr.split(" <= ");
    [def.head, def.relation, def.tail] = splitAtom(headStr);

    if(entities) {
        if(!(variables.includes(def.head))){
            entities.add(def.head);
        }
        if(!(variables.includes(def.tail))){
            entities.add(def.tail);
        }
    }
    if (relations){
        relations.add(def.relation);
    }

    bodyStr.split(", ").forEach((element)=> {
        var [head, relation, tail] = splitAtom(element);
        if(entities){
            if(!(variables.includes(head))){
                entities.add(head);
            } else if(head !== "Y" && head !== "X"){
                def.hasUnboundVariables = true;
            }
            if(!(variables.includes(tail))){
                entities.add(tail);
            } else if(tail !== "Y" && tail !== "X"){
                def.hasUnboundVariables = true;
            }
        }
        if(relations){
            relations.add(relation);
        }
        def["bodies"].push({
            relation: relation,
            head: head,
            tail: tail
        })
    });



    return def
}

function getJson(explanations){
    var entities = new Set();
    var relations = new Set();
    var groups = explanations.reduce((groups, item) => {
        
        var definition = splitRule(item.RuleDefinition, entities, relations)

        return {
            ...groups,
            [item.ClusterID]: {
            "ID": item.ClusterID,
            "Rules": [...(groups[item.ClusterID]?.Rules || []), 
                {
                    "ID": item.RuleID,
                    "Confidence": item.RuleConfidence,
                    "CorrectlyPredicted": item.RuleCorrectlyPredicted,
                    "Predicted": item.RulePredicted,
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
    return [groups, entities, relations];
}

exports.rpcmethods = rpcmethods;