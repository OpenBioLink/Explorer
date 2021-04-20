'use strict';

let index = require('./db_index');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
var zlib = require("zlib");



let explainationmethods = {
    templ:{
        description: ``,
        params: [],
        returns: [''],
        exec() {
            return new Promise((resolve) => {
                if (typeof (userObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                
            });
        }
    },
    create:{
        description: ``,
        params: [],
        returns: [''],
        exec(fields, files) {
            return new Promise((resolve) => {
                //required
                var id = uuidv4();
                var publish = fields.publish === "on" ? true : false;
                var datasetid = fields.datasetid;
                var date = parseInt(Date.now() / 1000);

                // required if publish
                var label = fields.label ? fields.label : "";
                var method = fields.aggmethod ? fields.aggmethod : "";

                // optional
                var comment = fields.comment ? fields.comment : "";
                var ruleconfig = files.ruleconfig ? fs.readFileSync(files.ruleconfig.path, 'utf8') : "";
                if(ruleconfig != ""){
                    var lines = ruleconfig.split("\n");
                    var pass = [];
                    for(var i = 0;i < lines.length;i++){
                        if(!(lines[i].includes("/") || lines[i].includes("\\"))){
                            pass.push(lines[i]);
                        }
                    }
                    ruleconfig = pass.join("\n");
                }
                
                var clusteringconfig = files.clusteringconfig ?fs.readFileSync(files.clusteringconfig.path, 'utf8') : "";
                if(clusteringconfig != ""){
                    var lines = clusteringconfig.split("\n");
                    var pass = [];
                    for(var i = 0;i < lines.length;i++){
                        if(!(lines[i].includes("/") || lines[i].includes("\\"))){
                            pass.push(lines[i]);
                        }
                    }
                    clusteringconfig = pass.join("\n");
                }

                console.log(fields)
                console.log(files)

                var oldpath = files.explainationfile.path;
                var newpath = './db/' + id + '.db';
                fs.rename(oldpath, newpath, function (err) {
                    if (err) throw err;
                    if(publish){
                        index.publishNewExplaination(id, datasetid, label, date, comment, method, ruleconfig, clusteringconfig);
                    } else {
                        index.addTempExplaination(id, datasetid, date);
                    }
                    resolve({
                        pk: id,
                        published: publish,
                        success: true
                    });
                });

                

                /*
                const fileContents = fs.createReadStream(files.explainationfile.path);
                const writeStream = fs.createWriteStream('./db/' + id + '.db');
                const unzip = zlib.createUnzip();
                fileContents.pipe(unzip).pipe(writeStream);

                writeStream.on('finish', function(){
                    if(publish){
                        index.publishNewExplaination(id, datasetid, label, date, comment, method, ruleconfig, clusteringconfig);
                    } else {
                        index.addTempExplaination(id, datasetid, date);
                    }
                    resolve({
                        pk: id,
                        published: publish,
                        success: true
                    });
                });
                */
            });
        }
    },
};

module.exports = explainationmethods;