
<img align="left" src="https://raw.githubusercontent.com/OpenBioLink/Explorer/main/icon.svg" alt="LinkExplorer Logo">
<h1>LinkExplorer</h1>

The LinkExplorer is a web-based tool for exploring nodes and relations of link prediction benchmark datasets and explanations of predictions done with the rule-based approach [SAFRAN](https://github.com/OpenBioLink/SAFRAN). A running instance of this tool can be found at:

<p align="center">
    <a style="font-size:20px;" href="http://explore.ai-strategies.org">http://explore.ai-strategies.org</a>
</p>

Included are three biomedical knowledge bases:

+ OpenBioLink
+ Hetionet
+ Pheknowlator

and two general-domain benchmarks:

+ YAGO3-10
+ WN18RR

## Tutorial

A screenshot tutorial of the main functionalities can be found at [https://openbiolink.github.io/Explorer/](https://openbiolink.github.io/Explorer/).

## BYOD (Bring your own data)

### Dataset metadata (RDF)

LinkExplorer retrieves metadata of benchmark datasets from RDF graphs, which provides labels, descriptions of nodes and relations in the dataset, as well as the edges of the dataset. You can extend LinkExplorer with your own dataset metadata graph by specifying the endpoint of your RDF graph after clicking on the button 'Load custom endpoint' in the dataset loading screen (`/loader`). Further information about the schema of the RDF graphs can be found [here](https://github.com/OpenBioLink/Utilities/tree/main/data/KGCLabelgraphs).

**If you want to make your RDF graph publicly available, please contact us!**

### Explanation files

You can load any explanation file produced with SAFRAN, by clicking on 'Load local explanation' and selecting the generated `.db` file. Metadata graphs of custom explanation files can be either 'None', a public graph (From the dropdown) or a custom graph (see [here](#dataset-metadata-rdf)).

## Host LinkExplorer yourself

1. Clone repository

2. Start **server** by running (Starts backend on port 3001)

```bash
cd server
npm install
npm run start
```

3. Build and host **client**

```bash
cd client
npm install
npm run build
```

and host the static build with a web server. All `/rpc` calls have to be proxied to the backend node server.

**Example with https://github.com/lwsjs/local-web-server**

The following command hosts LinkExplorer client at port 5000 and proxies all `/rpc` calls to the backend.

```bash
ws --port 5000 --directory build --spa index.html --rewrite '/rpc -> http://localhost:3001/rpc'
```

4. Host your own SPARQL Endpoint

Generally you can use whatever graph database you want that supports [RDF\*/SPARQL\*](https://github.com/blazegraph/database/wiki/Reification_Done_Right). We included a blazegraph, which can be started by running 

```bash
cd server/blazegraph
python start.py
```

Further information can be found at https://blazegraph.com. 

*Optional* If you want to populate the blazegraph server with the datasets mentioned above run `python setup.py` with a running blazegraph instance.

5. Open http://localhost:5000

## Citation

```bibtex
@inproceedings{
  TBD
}
```
