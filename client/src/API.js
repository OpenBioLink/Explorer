

function callRPC(func, body, callback){
    var jsonReq = {
        [func]: body
    }
    console.log(jsonReq);
    fetch('/rpc', {
        method: 'POST',
        body: JSON.stringify(jsonReq)
        })
        .then((response) => {return response.json()})
        .then((jsonResp) => {
            callback(jsonResp[func]);
        });
}

export function getAllDatasets(callback){
    callRPC("getAllDatasets", {}, callback);
}

export function getAllExplainationsByDatasetID(datasetID, callback){
    callRPC("getAllExplainationsByDatasetID", {"datasetID": datasetID}, callback);
}

export function getAllTestEntities(dbID, callback){
    console.log(dbID);
    callRPC("getAllTestEntities", {"dbID": dbID}, callback);
}

export function getInfoByCurie(dbID, curie, callback){
    callRPC("getInfoByCurie", {"dbID": dbID, "curie": curie}, callback);
}

export function getTasksByCurie(dbID, curie, callback){
    callRPC("getTasksByCurie", {"dbID": dbID, "curie": curie}, callback);
}

export function getPredictionsByTaskID(dbID, taskID, callback){
    callRPC("getPredictionsByTaskID", {"dbID": dbID, "taskID": taskID}, callback);
}

export function getExplainations(dbID, taskID, entityID, callback){
    callRPC("getExplainations", {"dbID": dbID, "taskID": taskID, "entityID": entityID}, callback);
}