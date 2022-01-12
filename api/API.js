let { indexmethods } = require('./indexmethods');
let { rpcmethods } = require('./rpcmethods');

function thisIsServer(){
    return (typeof window === 'undefined')
}

function resolveEndpoint(body){
    return new Promise((resolve, reject) => {
        if (body.datasetID == undefined){
            resolve(body);
        } else if (body.datasetID?.startsWith("local")){
            body.endpoint = body.datasetID.replace("local-","")
            resolve(body);
        } else {
            callRemote("getEndpointFromDatasetID", {"datasetID": body.datasetID}).then((response) => {
                body.endpoint = response;
                resolve(body);
            });
        }
    });
}

// Function caller for client
function call(func, body, callback){
    resolveEndpoint(body).then((body) => {
        if(body.explanationID?.startsWith("local") || body.datasetID?.startsWith("local")){
            return callLocal(func, body);
        } else {
            return callRemote(func, body);
        }
    }).then((response) => {
        callback(response);
    });
}

// Gets called by call(...)
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

// Gets called by call(...) or directly by server (via callRemote)
function callLocal(func, body){
    return new Promise((resolve, reject) => {
        // TBD check if it makes a difference if call own URL instead of localhost

        if(thisIsServer() && body.endpoint){
            body.endpoint = body.endpoint.replace("explore.ai-strategies.org", "localhost");
        }


        let execPromise = null;
        if (rpcmethods[func] && typeof (rpcmethods[func].exec) === 'function') {
            execPromise = rpcmethods[func].exec.call(null, body);
            if (!(execPromise instanceof Promise)) {
                throw new Error(`exec on ${func} did not return a promise`);
            }
        } else if (indexmethods[func] && typeof (indexmethods[func].exec) === 'function') {
            execPromise = indexmethods[func].exec.call(null, body);
            if (!(execPromise instanceof Promise)) {
                throw new Error(`exec on ${func} did not return a promise`);
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

function getAllExplanationsByDatasetID(datasetID, callback){
    call("getAllExplanationsByDatasetID", {
        "datasetID": datasetID
    }, callback);
}

function getAllTestEntities(datasetID, explanationID, callback){
    call("getAllTestEntities", {
        "datasetID": datasetID, 
        "explanationID": explanationID
    }, callback);
}

function getTasksByCurie(datasetID, explanationID, curie, callback){
    call("getTasksByCurie", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "curie": curie
    }, callback);
}

function getTaskByID(datasetID, explanationID, entityID, callback){
    call("getTaskByID", {
        "datasetID": datasetID,
        "explanationID": explanationID, 
        "entityID": entityID
    }, callback);
}

function getPredictionsByTaskID(datasetID, explanationID, taskID, callback){
    call("getPredictionsByTaskID", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "taskID": taskID
    }, callback);
}

function getPredictionInfo(datasetID, explanationID, taskID, entityID, callback){
    call("getPredictionInfo", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "taskID": taskID,
        "entityID": entityID
    }, callback);
}

function getInfoByCurie(datasetID, curie, callback){
    call("getInfoByCurie", {
        "datasetID": datasetID, 
        "curie": curie
    }, callback);
}

function getInfoByEntityID(datasetID, explanationID, entityID, callback){
    call("getInfoByEntityID", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "entityID": entityID
    }, callback);
}

function getExplanations(datasetID, explanationID, taskID, entityID, callback){
    call("getExplanations", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "taskID": taskID, 
        "entityID": entityID
    }, callback);
}

function getOutgoingEdges(datasetID, curie, callback){
    call("getOutgoingEdges", {
        "datasetID": datasetID, 
        "curie": curie
    }, callback);
}

function getIncomingEdges(datasetID, curie, callback){
    call("getIncomingEdges", {
        "datasetID": datasetID, 
        "curie": curie
    }, callback);
}

function getInstantiations(datasetID, explanationID, ruleID, head, tail, callback){
    call("getInstantiations", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "ruleID": ruleID,
        "head": head,
        "tail": tail
    }, callback);
}

API = {
    call,
    callLocal,
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