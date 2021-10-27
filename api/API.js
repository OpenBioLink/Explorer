let { indexmethods } = require('./indexmethods');
let { rpcmethods } = require('./rpcmethods');

function call(func, body, callback){
    if(body.explanationID?.startsWith("local") || body.datasetID?.startsWith("local")){
        body.endpoint = decodeURI(body.endpoint.replace("local-", ""))
        callLocal(func, body).then((response) => {
            callback(response);
        });
    } else {
        callRemote(func, body).then((response) => {
            callback(response);
        });
    }
}

function callRemote(func, body){
    return new Promise((resolve, reject) => {
        var jsonReq = {
            [func]: body
        }
        console.log(jsonReq);
        // /rpc calls callLocal(...) on server
        fetch('/rpc', {
            method: 'POST',
            body: JSON.stringify(jsonReq)
        }).then((response) => {
            return response.json()
        }).then((jsonResp) => {
            resolve(jsonResp);
        });
    });
}

function callLocal(func, body){
    return new Promise((resolve, reject) => {
        let execPromise = null;
        if (rpcmethods[func] && typeof (rpcmethods[func].exec) === 'function') {
            execPromise = rpcmethods[func].exec.call(null, body);
            if (!(execPromise instanceof Promise)) {
                throw new Error(`exec on ${key} did not return a promise`);
            }
        } else if (indexmethods[func] && typeof (indexmethods[func].exec) === 'function') {
            execPromise = indexmethods[func].exec.call(null, body);
            if (!(execPromise instanceof Promise)) {
                throw new Error(`exec on ${key} did not return a promise`);
            }
        } else {
            execPromise = Promise.resolve({
                error: 'method not defined'
            })
        }

        execPromise.then(response => {
            resolve(response);
        }).catch(err => {
            reject(err);
        });
    });
}

// Maybe better with only promises

function getIndex(callback){
    call("getIndex", {}, callback);
}

function getAllDatasets(callback){
    call("getAllDatasets", {}, callback);
}

function getAllExplanationsByDatasetID(endpoint, callback){
    call("getAllExplanationsByDatasetID", {
        "endpoint": endpoint
    }, callback);
}

function getAllTestEntities(endpoint, explanationID, callback){
    call("getAllTestEntities", {
        "endpoint": endpoint, 
        "explanationID": explanationID
    }, callback);
}

function getTasksByCurie(endpoint, explanationID, curie, callback){
    call("getTasksByCurie", {
        "endpoint": endpoint, 
        "explanationID": explanationID, 
        "curie": curie
    }, callback);
}

function getTaskByID(endpoint, explanationID, entityID, callback){
    call("getTaskByID", {
        "endpoint": endpoint,
        "explanationID": explanationID, 
        "entityID": entityID
    }, callback);
}

function getPredictionsByTaskID(endpoint, explanationID, taskID, callback){
    call("getPredictionsByTaskID", {
        "endpoint": endpoint, 
        "explanationID": explanationID, 
        "taskID": taskID
    }, callback);
}

function getPredictionInfo(endpoint, explanationID, taskID, entityID, callback){
    call("getPredictionInfo", {
        "endpoint": endpoint, 
        "explanationID": explanationID, 
        "taskID": taskID,
        "entityID": entityID
    }, callback);
}

function getInfoByCurie(endpoint, curie, callback){
    call("getInfoByCurie", {
        "endpoint": endpoint, 
        "curie": curie
    }, callback);
}

function getInfoByEntityID(endpoint, explanationID, entityID, callback){
    call("getInfoByEntityID", {
        "endpoint": endpoint, 
        "explanationID": explanationID, 
        "entityID": entityID
    }, callback);
}

function getExplanations(endpoint, explanationID, taskID, entityID, callback){
    call("getExplanations", {
        "endpoint": endpoint, 
        "explanationID": explanationID, 
        "taskID": taskID, 
        "entityID": entityID
    }, callback);
}

function getOutgoingEdges(endpoint, curie, callback){
    call("getOutgoingEdges", {
        "endpoint": endpoint, 
        "curie": curie
    }, callback);
}

function getIncomingEdges(endpoint, curie, callback){
    call("getIncomingEdges", {
        "endpoint": endpoint, 
        "curie": curie
    }, callback);
}

function getInstantiations(endpoint, explanationID, ruleID, head, tail, callback){
    call("getInstantiations", {
        "endpoint": endpoint, 
        "explanationID": explanationID, 
        "ruleID": ruleID,
        "head": head,
        "tail": tail
    }, callback);
}

API = {
    call,
    callLocal,
    callRemote,
    getAllDatasets,
    getAllExplanationsByDatasetID,
    getAllTestEntities,
    getTasksByCurie,
    getTaskByID,
    getPredictionsByTaskID,
    getPredictionInfo,
    getInfoByCurie,
    getInfoByEntityID,
    getExplanations,
    getOutgoingEdges,
    getIncomingEdges,
    getInstantiations,
    getIndex
}
module.exports = API 