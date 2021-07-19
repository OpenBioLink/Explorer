
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

export function callExplanationOperation(form, zip_files, callback){
    let data = new FormData(form);

    // cannot use fetch here, need to track upload progress
    let request = new XMLHttpRequest();
    request.open('POST', '/expl');

    request.upload.addEventListener('progress', (e) => {
        let perc = parseInt((e.loaded / e.total) * 100);
        callback('progress', perc, null, null);
    })
    request.addEventListener('load', (response) => {
        var jsonResponse = JSON.parse(response.currentTarget.responseText);
        callback('done', null, jsonResponse["pk"], jsonResponse["published"]);
    });
    request.send(data);

    // zipping is very slow
    /*
    zip_files.forEach(element => {
        callback('zip', null, null, null);
        var reader = new FileReader();
        reader.onload = function(evt) {
            console.log("sucess");
            const compressed = pako.deflate(reader.result);
            var blob = new Blob([ compressed ], { type: 'application/octet-stream'});
            data.set(element, blob);
            // cannot use fetch here, need to track upload progress
            let request = new XMLHttpRequest();
            request.open('POST', '/explanation');
        
            request.upload.addEventListener('progress', (e) => {
                let perc = parseInt((e.loaded / e.total) * 100);
                callback('progress', perc, null, null);
            })
            request.addEventListener('load', (response) => {
                var jsonResponse = JSON.parse(response.currentTarget.responseText);
                callback('done', null, jsonResponse["pk"], jsonResponse["published"]);
            });
            request.send(data);
        };
        reader.readAsArrayBuffer(form[element].files[0]);
    });
    */
    
}

export function addNewDataset(data, callback){
    callRPC("addNewDataset", data, callback);
}

export function getAllDatasets(callback){
    callRPC("getAllDatasets", {}, callback);
}

export function getAllExplanationsByDatasetID(datasetID, callback){
    callRPC("getAllExplanationsByDatasetID", {
        "datasetID": datasetID
    }, callback);
}

export function getAllTestEntities(datasetID, explanationID, callback){
    callRPC("getAllTestEntities", {
        "datasetID": datasetID, 
        "explanationID": explanationID
    }, callback);
}

export function getTasksByCurie(datasetID, explanationID, curie, callback){
    callRPC("getTasksByCurie", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "curie": curie
    }, callback);
}

export function getTasksByEntityID(datasetID, explanationID, entityID, callback){
    callRPC("getTasksByEntityID", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "entityID": entityID
    }, callback);
}

export function getTaskByID(datasetID, explanationID, entityID, callback){
    callRPC("getTaskByID", {
        "datasetID": datasetID,
        "explanationID": explanationID, 
        "entityID": entityID
    }, callback);
}

export function getPredictionsByTaskID(datasetID, explanationID, taskID, callback){
    callRPC("getPredictionsByTaskID", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "taskID": taskID
    }, callback);
}

export function getPredictionInfo(datasetID, explanationID, taskID, entityID, callback){
    callRPC("getPredictionInfo", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "taskID": taskID,
        "entityID": entityID
    }, callback);
}

export function getInfoByCurie(datasetID, curie, callback){
    callRPC("getInfoByCurie", {
        "datasetID": datasetID, 
        "curie": curie
    }, callback);
}

export function getInfoByEntityID(datasetID, explanationID, entityID, callback){
    callRPC("getInfoByEntityID", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "entityID": entityID
    }, callback);
}

export function getExplanations(datasetID, explanationID, taskID, entityID, callback){
    callRPC("getExplanations", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "taskID": taskID, 
        "entityID": entityID
    }, callback);
}

export function getOutgoingEdges(datasetID, curie, callback){
    callRPC("getOutgoingEdges", {
        "datasetID": datasetID, 
        "curie": curie
    }, callback);
}

export function getIncomingEdges(datasetID, curie, callback){
    callRPC("getIncomingEdges", {
        "datasetID": datasetID, 
        "curie": curie
    }, callback);
}

export function getInstantiations(datasetID, explanationID, ruleID, head, tail, callback){
    callRPC("getInstantiations", {
        "datasetID": datasetID, 
        "explanationID": explanationID, 
        "ruleID": ruleID,
        "head": head,
        "tail": tail
    }, callback);
}