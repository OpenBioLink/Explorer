'use strict';

const {createNewDataset} = require('./graph_label');
let index = require('./db_index');
const {tic, toc}  = require('./util');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
var JSZip = require("jszip");


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
                console.log(files.label_graph.path);
                fs.readFile(files.label_graph.path, function(err, data) {
                    if (err) throw err;
                    JSZip.loadAsync(data).then(function (zip) {
                        zip.file("zipped.dat").async('nodebuffer').then((blob) => {
                            fs.writeFile(files.label_graph.path, blob, function (err) {
                                if (err) throw err;
                                console.log('Saved!');
                                console.log(fields);
                
                                var namespace = fields.namespace;
                                var dbName = fields.dbName;
                                var dbVersion = fields.dbVersion ? fields.dbVersion : "";
                                var dbDescription = fields.dbDescription ? fields.dbDescription : "";
                                var publish = fields.publish === "on" ? true : false;
                                var id = uuidv4();

                                console.log(namespace);
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
                            }); 
                        })
                    });
                });
            });
        }
    },
};

module.exports = datasetmethods;