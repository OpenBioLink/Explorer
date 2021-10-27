/* index.json format:

{
    "dataset": [
        "ID"	TEXT NOT NULL,
        "Endpoint" TEXT NOT NULL,
        "Name"	TEXT NOT NULL,
        "Version"	TEXT,
        "Description"	TEXT,
        "Namespace"	TEXT NOT NULL
    ],
    "explanation":[
        "ID"	TEXT NOT NULL,
        "DatasetID"	TEXT NOT NULL,
        "Label"	TEXT,
        "Date"	INTEGER NOT NULL,
        "Comment"	TEXT,
        "Method"	TEXT NOT NULL,
        "RuleConfig"	TEXT,
        "ClusteringConfig"	TEXT
    ]

}


*/

'use strict';

const fs = require('fs');

function getIndex(){
    return JSON.parse(fs.readFileSync('./db/index.json'));
}

let indexMethods = {
    getEndpointFromDatasetID(datasetID){
        let index = getIndex()
        let dataset = index["dataset"].find(dataset => dataset["ID"] == datasetID)
        // TODO not existant datasetID?
        return [dataset["Endpoint"], dataset["Namespace"]]
    },
    getAllDatasets(){
        let index = getIndex()
        return index["dataset"];
    },
    getExplanationsByDatasetID(datasetID){
        let index = getIndex()
        let explanations = index["explanation"].filter(explanation => explanation["DatasetID"] == datasetID)
        return explanations
    }
}

exports.indexMethods = indexMethods;