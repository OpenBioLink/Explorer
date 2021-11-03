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
let {tic, toc} = require("./util")

function getIndex(){
    return JSON.parse(fs.readFileSync('./db/index.json'));
}

let indexmethods = {
    templ:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
            });
        }
    },
    getIndex:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
                tic();
                let index = getIndex();
                toc("getAllDatasets");
                resolve(index || {});
            });
        }
    },
    getEndpointFromDatasetID:{
        description: ``,
        params: [],
        returns: [''],
        exec(body) {
            return new Promise((resolve) => {
                tic();
                var index = getIndex();
                var dataset = index["Dataset"].find(dataset => dataset["ID"] == body.datasetID);
                // TODO not existant datasetID?
                toc("getEndpointFromDatasetID");
                resolve(dataset["Endpoint"] || {});
            });
        }
    },
};

exports.indexmethods = indexmethods;