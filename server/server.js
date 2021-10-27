'use strict';

let http = require('http');
let url = require('url');
let api = require('api');
let types = require('api/types');

let server = http.createServer(requestListener);
const PORT = process.env.PORT || 3001;

let routes = {
    '/rpc': function (body) {
        return new Promise((resolve, reject) => {
            if (!body) {
                throw new (`rpc request was expecting some data...!`);
            }
            let _json = JSON.parse(body); // might throw error
            let func = Object.keys(_json)[0];
            console.log("HI")
            console.log(func)
            console.log(_json[func])
            api.callLocal(func, _json[func]).then(response => {
                console.log(response);
                resolve(response);
            }).catch(err => {
                reject(err);
            });
        });
    },
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

function requestListener(request, response) {
    let reqUrl = `http://${request.headers.host}${request.url}`;
    let parseUrl = url.parse(reqUrl, true);
    let pathname = parseUrl.pathname;

    response.setHeader('Content-Type', 'application/json');

    let buf = null;
    request.on('data', data => {
        if (buf === null) {
            buf = data;
        } else {
            buf = buf + data;
        }
    });

    request.on('end', () => {
        let body = buf !== null ? buf.toString() : null;

        if (routes[pathname]) {
            let compute = routes[pathname].call(null, body);

            if (!(compute instanceof Promise)) {
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

server.listen(PORT);