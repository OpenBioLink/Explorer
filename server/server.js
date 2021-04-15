'use strict';

let http = require('http');
let url = require('url');
let rpcmethods = require('./rpcmethods');
let datasetmethods = require('./datasetmethods');
let explainationmethods = require('./explainationmethods');
let types = require('./types');
const fs = require('fs');
var formidable = require('formidable');
const {createNewDataset} = require('./graph_label');

let server = http.createServer(requestListener);
const PORT = process.env.PORT || 3001;

// we'll use a very very very simple routing mechanism
// don't do something like this in production, ok technically you can...
// probably could even be faster than using a routing library :-D

let routes = {
    '/dataset': function(fields, files){
        return new Promise((resolve, reject) => {
            let execPromise = null;
            if (datasetmethods[fields.method] && typeof (datasetmethods[fields.method].exec) === 'function') {
                execPromise = datasetmethods[fields.method].exec.call(null, fields, files);
                if (!(execPromise instanceof Promise)) {
                    throw new Error(`exec on ${key} did not return a promise`);
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
    },
    '/explaination': function(fields, files){
        return new Promise((resolve, reject) => {
            let execPromise = null;
            if (explainationmethods[fields.method] && typeof (explainationmethods[fields.method].exec) === 'function') {
                execPromise = explainationmethods[fields.method].exec.call(null, fields, files);
                if (!(execPromise instanceof Promise)) {
                    throw new Error(`exec on ${key} did not return a promise`);
                }
            } else {
                execPromise = Promise.resolve({
                    error: 'method not defined'
                })
            }
            execPromise.then((response) => {
                resolve(response);
            }).catch(err => {
                reject(err);
            });
        });
    },
    // this is the rpc endpoint
    // every operation request will come through here
    '/rpc': function (body) {
        return new Promise((resolve, reject) => {
            if (!body) {
                throw new (`rpc request was expecting some data...!`);
            }
            let _json = JSON.parse(body); // might throw error
            let keys = Object.keys(_json);
            let promiseArr = [];

            for (let key of keys) {
                if (rpcmethods[key] && typeof (rpcmethods[key].exec) === 'function') {
                    let execPromise = rpcmethods[key].exec.call(null, _json[key]);
                    if (!(execPromise instanceof Promise)) {
                        throw new Error(`exec on ${key} did not return a promise`);
                    }
                    promiseArr.push(execPromise);
                } else {
                    let execPromise = Promise.resolve({
                        error: 'method not defined'
                    })
                    promiseArr.push(execPromise);
                }
            }

            Promise.all(promiseArr).then(iter => {
                //console.log(iter);
                let response = {};
                iter.forEach((val, index) => {
                    response[keys[index]] = val;
                });

                resolve(response);
            }).catch(err => {
                reject(err);
            });
        });
    },

    // this is our docs endpoint
    // through this the clients should know
    // what methods and datatypes are available
    '/describe': function () {
        // load the type descriptions
        return new Promise(resolve => {
            let type = {};
            let method = {};

            // set types
            type = types;

            //set methods
            for(let m in rpcmethods) {
                let _m = JSON.parse(JSON.stringify(rpcmethods[m]));
                method[m] = _m;
            }

            resolve({
                types: type,
                methods: method
            });
        });
    }
};

// request Listener
// this is what we'll feed into http.createServer
function requestListener(request, response) {
    let reqUrl = `http://${request.headers.host}${request.url}`;
    let parseUrl = url.parse(reqUrl, true);
    let pathname = parseUrl.pathname;

    if(pathname == "/dataset" || pathname == "/explaination"){
        //maxFileSize = 2GB
        var form = new formidable.IncomingForm({maxFileSize:2000*1024*1024});
        form.parse(request, function (err, fields, files) {
            if(err){
                console.log(`Request was expecting a form... Error: ${err.toString()}`);
            }
            if(!fields.method){
                throw new ("Request was expecting a form containing the field method (upload, edit, delete)");
            }
            let compute = routes[pathname].call(null, fields, files);

            compute.then(res => {
                response.end(JSON.stringify(res))
            }).catch(err => {
                console.error(err);
                response.statusCode = 500;
                response.end('oops! server error!');
            });
        });
    } else {
        // we're doing everything json
        response.setHeader('Content-Type', 'application/json');

        // buffer for incoming data
        let buf = null;

        // listen for incoming data
        request.on('data', data => {
            if (buf === null) {
                buf = data;
            } else {
                buf = buf + data;
            }
        });

        // on end proceed with compute
        request.on('end', () => {
            let body = buf !== null ? buf.toString() : null;

            if (routes[pathname]) {
                let compute = routes[pathname].call(null, body);

                if (!(compute instanceof Promise)) {
                    // we're kinda expecting compute to be a promise
                    // so if it isn't, just avoid it

                    response.statusCode = 500;
                    response.end('oops! server error!');
                    console.warn(`whatever I got from rpc wasn't a Promise!`);
                } else {
                    compute.then(res => {
                        response.end(JSON.stringify(res))
                    }).catch(err => {
                        console.error(err);
                        response.statusCode = 500;
                        response.end('oops! server error!');
                    });
                }

            } else {
                response.statusCode = 404;
                response.end(`oops! ${pathname} not found here`)
            }
        })
    }

    
}

// now we can start up the server
server.listen(PORT);