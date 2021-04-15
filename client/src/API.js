
import JSZip from 'jszip'

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


export function callDatasetOperation(form, zip_files, callback){
    let data = new FormData(form);

    zip_files.forEach(element => {
        callback('zip', null, null, null);
        var zip = new JSZip();
        console.log("StartZIP");
        zip.file("zipped.dat", form[element].files[0]);
        zip.generateAsync({
            type: "blob",
            compression: "DEFLATE"
        }).then(function (blob) {
            console.log("sucess");
            data.set(element, blob);
            // cannot use fetch here, need to track upload progress
            let request = new XMLHttpRequest();
            request.open('POST', '/dataset');

            request.upload.addEventListener('progress', (e) => {
                let perc = parseInt((e.loaded / e.total) * 100);
                callback('progress', perc, null, false);
            })
            request.addEventListener('load', function(response){
                var jsonResponse = JSON.parse(response.currentTarget.responseText)
                callback('done', null, jsonResponse["pk"], jsonResponse["published"]);
            });
            request.send(data);
        });
    });
}

export function callExplainationOperation(form, zip_files, callback){
    console.log("FORMDATA");
    let data = new FormData(form);

    zip_files.forEach(element => {
        callback('zip', null, null, null);
        var zip = new JSZip();
        zip.file("zipped.dat", form[element].files[0]);
        zip.generateAsync({
            type: "blob",
            compression: "DEFLATE"
        }).then(function (blob) {
            console.log("sucess");
            data.set(element, blob);
            // cannot use fetch here, need to track upload progress
            let request = new XMLHttpRequest();
            request.open('POST', '/explaination');
        
            request.upload.addEventListener('progress', (e) => {
                let perc = parseInt((e.loaded / e.total) * 100);
                callback('progress', perc, null, null);
            })
            request.addEventListener('load', (response) => {
                var jsonResponse = JSON.parse(response.currentTarget.responseText);
                callback('done', null, jsonResponse["pk"], jsonResponse["published"]);
            });
            request.send(data);
        });
    });

    
}

export function getAllDatasets(callback){
    callRPC("getAllDatasets", {}, callback);
}

export function getAllExplainationsByDatasetID(datasetID, callback){
    callRPC("getAllExplainationsByDatasetID", {
        "datasetID": datasetID
    }, callback);
}

export function getAllTestEntities(datasetID, explainationID, callback){
    callRPC("getAllTestEntities", {
        "datasetID": datasetID, 
        "explainationID": explainationID
    }, callback);
}

export function getTasksByCurie(explainationID, curie, callback){
    callRPC("getTasksByCurie", {
        "explainationID": explainationID, 
        "curie": curie
    }, callback);
}

export function getTasksByEntityID(explainationID, entityID, callback){
    callRPC("getTasksByEntityID", {
        "explainationID": explainationID, 
        "entityID": entityID
    }, callback);
}

export function getTaskByID(explainationID, entityID, callback){
    callRPC("getTaskByID", {
        "explainationID": explainationID, 
        "entityID": entityID
    }, callback);
}

export function getPredictionsByTaskID(datasetID, explainationID, taskID, callback){
    callRPC("getPredictionsByTaskID", {
        "datasetID": datasetID, 
        "explainationID": explainationID, 
        "taskID": taskID
    }, callback);
}

export function getInfoByCurie(datasetID, curie, callback){
    callRPC("getInfoByCurie", {
        "datasetID": datasetID, 
        "curie": curie
    }, callback);
}

export function getInfoByEntityID(datasetID, explainationID, entityID, callback){
    callRPC("getInfoByEntityID", {
        "datasetID": datasetID, 
        "explainationID": explainationID, 
        "entityID": entityID
    }, callback);
}

export function getExplainations(datasetID, explainationID, taskID, entityID, callback){
    callRPC("getExplainations", {
        "datasetID": datasetID, 
        "explainationID": explainationID, 
        "taskID": taskID, 
        "entityID": entityID
    }, callback);
}