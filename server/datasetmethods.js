'use strict';

const {createNewDataset} = require('./graph_label');
let index = require('./db_index');
const {tic, toc}  = require('./util');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
var zlib = require("zlib");



let datasetmethods = {
    templ:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
                
            });
        }
    },
    create:{
        description: ``,
        params: [],
        returns: [''],
        exec(fields, files) {
            return new Promise((resolve) => {

                var namespace = fields.namespace;
                var dbName = fields.dbName;
                var dbVersion = fields.dbVersion ? fields.dbVersion : "";
                var dbDescription = fields.dbDescription ? fields.dbDescription : "";
                var publish = fields.publish === "on" ? true : false;
                var id = uuidv4();

                createNewDataset(id, files.label_graph.path, fields.rdftype, (success) => {
                    if(success){
                        if(publish){
                            index.publishNewDataset(id, dbName, dbVersion, dbDescription, namespace);
                        } else {
                            index.addTempDataset(id, namespace, parseInt(Date.now() / 1000));
                        }
                        resolve({
                            pk: id,
                            published: publish,
                            success: success
                        });
                    }
                });

                /*
                const fileContents = fs.createReadStream(files.label_graph.path);
                const writeStream = fs.createWriteStream(files.label_graph.path + "_");
                const unzip = zlib.createUnzip();
                fileContents.pipe(unzip).pipe(writeStream);

                writeStream.on('finish', function(){
                    console.log(namespace);
                    createNewDataset(id, files.label_graph.path + "_", fields.rdftype, (success) => {
                        if(success){
                            if(publish){
                                index.publishNewDataset(id, dbName, dbVersion, dbDescription, namespace);
                            } else {
                                index.addTempDataset(id, namespace, parseInt(Date.now() / 1000));
                            }
                            resolve({
                                pk: id,
                                published: publish,
                                success: success
                            });
                        }
                    });
                });
                */
            });
        }
    },
};

module.exports = datasetmethods;