'use strict';

let db = require('./db_explanation');
let index = require('./db_index');
let {graph_label: graph} = require('./graph_label');
const {runSPARQL} = require('./graph_label');

const {tic, toc, variables}  = require('./util');

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
                tic();
                var datasets = index.getAllDatasets();
                toc("getAllDatasets");
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
                tic();
                var explanations = index.getExplanationsByDatasetID(body.datasetID);
                toc("getAllExplanationsByDatasetID")
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
                var namespace = index.getNamespaceFromDatasetID(body.datasetID);
                graph.getAllTestEntities(body.datasetID, namespace, (labeled_entities, types) => {
                    resolve({entities: labeled_entities, types: types} || {});
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
                tic();
                var tasks = db.getTasksByCurie(body.explanationID, body.curie);
                toc("getTasksByCurie")
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
                tic();
                var tasks = db.getTasksByEntityID(body.explanationID, body.entityID);
                toc("getTasksByEntityID")
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
                tic();
                var task = db.getTaskByID(body.explanationID, body.entityID);
                toc("getTaskByID");
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
                tic();
                var predictions = db.getPredictionsByTaskID(body.explanationID, body.taskID);
                var namespace = index.getNamespaceFromDatasetID(body.datasetID);
                graph.addLabelsToPredictions(body.datasetID, namespace, predictions, (labeled_predictions) => {
                    toc("getPredictionsByTaskID");
                    resolve(labeled_predictions || {});
                })
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
                    tail: {
                        label: "",
                        curie: ""
                    },
                    hit: false,
                    confidence: null
                }

                var task = db.getTaskByID(body.explanationID, body.taskID);
                var prediction = db.getPredictionByID(body.explanationID, body.taskID, body.entityID);
                var namespace = index.getNamespaceFromDatasetID(body.datasetID);
                
                _res["rel"] = task["RelationName"]; 
                _res["hit"] = prediction["Hit"];
                _res["confidence"] = prediction["Confidence"];

                graph.getInfoByCurie(body.datasetID, namespace, task["EntityName"], (taskEntityInfo) => {
                    if(task["IsHead"] == 1){
                        _res["head"]["label"] = taskEntityInfo["Label"] ? taskEntityInfo["Label"] : null
                        _res["head"]["curie"] = task["EntityName"]
                    } else {
                        _res["tail"]["label"] = taskEntityInfo["Label"] ? taskEntityInfo["Label"] : null
                        _res["tail"]["curie"] = task["EntityName"]
                    }
                    graph.getInfoByCurie(body.datasetID, namespace, prediction["EntityName"], (predictionEntityInfo) => {
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
                var namespace = index.getNamespaceFromDatasetID(body.datasetID);
                graph.getInfoByCurie(body.datasetID, namespace, body.curie, (res) => {
                    toc("getInfoByCurie");
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
    getExplanations:{
        description: ``,
        params: ['datasetID', 'explanationID', 'taskID', 'entityID'],
        returns: [''],
        exec(body) {
            //body.taskID, body.entityID
            return new Promise((resolve) => {
                tic();
                var explanations = db.getExplanations(body.explanationID, body.taskID, body.entityID);
                var [explanations, entities] = getJson(explanations);
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
    getOutgoingEdges:{
        description: ``,
        params: ['datasetID', 'curie'],
        returns: [''],
        exec(body) {
            //body.taskID, body.entityID
            return new Promise((resolve) => {
                tic();
                var namespace = index.getNamespaceFromDatasetID(body.datasetID)
                graph.getOutgoingEdges(body.datasetID, namespace, body.curie, (outgoing) => {
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
                var namespace = index.getNamespaceFromDatasetID(body.datasetID)
                graph.getIncomingEdges(body.datasetID, namespace, body.curie, (incoming) => {
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
                var namespace = index.getNamespaceFromDatasetID(body.datasetID);
                var rule = db.getRuleByID(body.explanationID, body.ruleID);
                var def = splitRule(rule["DEF"]);
                graph.getInstantiations(body.datasetID, namespace, body.head, body.tail, def, (instantiations) => {
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

function splitRule(ruleStr, entities){

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
    var groups = explanations.reduce((groups, item) => {
        
        var definition = splitRule(item.RuleDefinition, entities)

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
    return [groups, entities];
}

module.exports = rpcmethods;