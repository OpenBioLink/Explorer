'use strict';

let queries = require('./db');

let db_index = {
    getEndpointFromDatasetID(datasetID){
        var sql = `
        select 
            Endpoint, Namespace
        from dataset 
        where dataset.id = '${datasetID}';
        `;
        var dataset = queries.get('index', sql);
        if(dataset){
            return [dataset["Endpoint"], dataset["Namespace"]];
        } else {
            var sql = `
            select 
                Endpoint, Namespace
            from Temp_Dataset 
            where Temp_Dataset.id = '${datasetID}';
            `;
            dataset = queries.get('index', sql);
            if(dataset){
                return [dataset["Endpoint"], dataset["Namespace"]];
            } else {
                console.log("Not found");
            }
        }
    },
    getAllDatasets(){
        var sql = `select * from dataset;`;
        return queries.all('index', sql);
    },
    getExplanationsByDatasetID(datasetID){
        var sql = `select * from explaination where explaination.datasetid = '${datasetID}';`;
        return queries.all('index', sql);
    },
    publishNewDataset(id, name, version, description, endpoint, namespace){
        var sql = `INSERT into Dataset (ID, Name, Version, Description, Endpoint, Namespace) VALUES ('${id}', '${name}', '${version}', '${description}', '${endpoint}', '${namespace}')`;
        var res = queries.run('index', sql);
        return res;
    },
    addTempDataset(id, endpoint, namespace, date){
        var sql = `INSERT into Temp_Dataset (ID, Endpoint, Namespace, Date) VALUES ('${id}', '${endpoint}', '${namespace}', ${date})`;
        var res = queries.run('index', sql);
        return res;
    },
    publishNewExplanation(id, datasetid, label, date, comment, method, ruleconfig, clusteringconfig){
        // TBD check if datasetID is published (shouldnt work anyway as foreign key)
        var sql = `INSERT into Explaination (ID, DatasetID, Label, Date, Comment, Method, RuleConfig, ClusteringConfig) 
                    VALUES ('${id}', '${datasetid}', '${label}', ${date}, '${comment}', '${method}', '${ruleconfig}', '${clusteringconfig}')`;
        var res = queries.run('index', sql);
    },
    addTempExplanation(id, datasetid, date){
        var sql = `INSERT into Temp_Explaination (ID, DatasetID, Date) VALUES ('${id}', '${datasetid}', ${date})`;
        var res = queries.run('index', sql);
    }
}

module.exports = db_index