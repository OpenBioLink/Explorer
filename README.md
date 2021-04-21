# Explorer

## Backend Server

from `/Explorer/server`

```bash
npm install
node server.js
```

## Frontend Server

from `/Explorer/client`

```bash
 npm install
 npm install -g local-web-server
 npm run build
 ws --port 5000 --directory build --spa index.html --rewrite '/rpc -> http://localhost:3001/rpc' '/dataset -> http://localhost:3001/dataset' '/expl -> http://localhost:3001/expl'
```

https://github.com/lwsjs/local-web-server

## Fuseki

``` bash
wget https://mirror.klaus-uwe.me/apache/jena/binaries/apache-jena-fuseki-4.0.0.tar.gz
tar -xf apache-jena-fuseki-4.0.0.tar.gz
cd apache-jena-fuseki-4.0.0
./fuseki-server 
```
