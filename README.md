
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

<p align="center">
  <a href="https://www.biorxiv.org/content/10.1101/2022.01.09.475537v2">Paper preprint on bioRxiv</a> •
  <a href="https://doi.org/10.1093/bioinformatics/btac068">Peer reviewed paper in the journal Bioinformatics (for citations)</a> •
  <a href="https://oup.silverchair-cdn.com/oup/backfile/Content_public/Journal/bioinformatics/PAP/10.1093_bioinformatics_btac068/1/btac068_supplementary_data.pdf?Expires=1647519170&Signature=2zpLHPo0A4I8MK9VX8DeLcSMzsJdq-rVlmFaP-J2cZtQ9jzUv6VH6TEvjOzKRayRVuEqKQcaOqc0zs4QUQ9s2qZAi1CzRqESRQH4xHgN6ZVZ~37g~I12To9JXrpdTSqVsN3FYEnfy2Yw2kOmTcpMaN8SNTyAlWjlKJz5AB2Rvj4C8ikOJjUVVTU3KembUc-UStoHkEpX-rLrd7mwT2F1xiONirQAKRRg4qPDMUJy4AWD2m9b47d7~on2MMftJkNdiTCpt7p5xr9VCxO-XgiY~vAe1ZxYCrGOmHgMYqaVeK2jc4PYM0G271QeCL7uMcBU5Fn6sS5DASs6iesj0BiDGg__&Key-Pair-Id=APKAIE5G5CRDK6RD3PGA">Supplementary data</a> •
  <a href="#citation">Citation (bibTex)</a>
</p>

## Tutorial

A screenshot tutorial of the main functionalities can be found at [https://openbiolink.github.io/Explorer/](https://openbiolink.github.io/Explorer/).

## BYOD (Bring your own data)

### Dataset metadata (RDF)

LinkExplorer retrieves metadata of benchmark datasets from RDF graphs, which provides labels, descriptions of nodes and relations in the dataset, as well as the edges of the dataset. You can extend LinkExplorer with your own dataset metadata graph by specifying the endpoint of your RDF graph after clicking on the button 'Load custom endpoint' in the dataset loading screen (`/loader`). Further information about the schema of the RDF graphs can be found [here](https://github.com/OpenBioLink/Utilities/tree/main/data/dataset-metadata-graphs).

**If you want to make your RDF graph publicly available, please contact us!**

### Explanation files

You can load any explanation file produced with SAFRAN, by clicking on 'Load local explanation' and selecting the generated `.db` file. Metadata graphs of custom explanation files can be either 'None', a public graph (From the dropdown) or a custom graph (see [here](#dataset-metadata-rdf)).

## Host LinkExplorer yourself

### Docker

The LinkExplorer application can be run with *Docker*. We divide our application into three containers:

+ Client (The frontend of LinkExplorer)
+ API/Server (Hosts sqlite-Databases storing explanations of predictions in Benchmarks)
+ Blazegraph/RDF-Database (Database for metadata (Labels, Descriptions, ...) of entities in Benchmarks)

The LinkExplorer application is orchestrated through *Docker Compose* and can be run following these steps:

1. Install [Docker](https://docker.com)
2. Clone repository
3. Run `docker-compose up --build` from the `Explorer` folder

That's it!

Now the LinkExplorer app is accessible via http://localhost:5000, while Blazegraph is accessible via http://localhost:9999. Explanation files (sqlite) and the `index.json` should be added to `/server/db`. The host of all SPARQL endpoints that are running in the docker blazegraph container should be `blazegraph`, f.e. 

```text
{
    "Dataset": [
        {
            "ID": "wn18rr",
            "Endpoint": "http://blazegraph:9999/blazegraph/namespace/wn18rr/sparql",
            "Name": "WN18RR",
            "Version":	"",
            "Description":	"WN18RR is a link prediction dataset created from WN18, ...",
			"Explanation": [
				{
					"ID": "max",
          ...
```

### Manual execution

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

### Data

The central file which stores names, endpoints, explanations, ... of benchmarks hosted on the server is `index.json` which sould be stored under `/server/db`. A template can be found [here](https://github.com/OpenBioLink/Explorer/blob/main/server/db/index_template.json). 

Explanation files generated by SAFRAN (.db) should be stored in `/server/db` and should adhere to the following naming convention: `{ID of dataset}_{ID of explanation}.db`. F.e. the explanation file for WN18RR and Maximum aggregation should be `wn18rr_max.db` if the entry in the `index.json` is as follows

```
{
    "Dataset": [
        {
            "ID": "wn18rr",
            "Endpoint": "http://explore.ai-strategies.org:9999/blazegraph/namespace/wn18rr/sparql",
            "Name": "WN18RR",
            "Version":	"",
            "Description":	"WN18RR is a link prediction dataset created from WN18, ...",
            "Explanation": [
              {
                "ID": "max",
                "Label": "MAX",
                "Date": 1624529144,
                "Comment": "These results were retrieved by applying the MaxPlus (AnyBURL default) aggregation ...",
                "Method": "max",
                "RuleConfig": "SNAPSHOTS_AT = 1000 ...",
                "ClusteringConfig": ""
              },
        ...
```

## Citation

```bibtex
@article{10.1093/bioinformatics/btac068,
    author = {Ott, Simon and Barbosa-Silva, Adriano and Samwald, Matthias},
    title = "{LinkExplorer: Predicting, explaining and exploring links in large biomedical knowledge graphs}",
    journal = {Bioinformatics},
    year = {2022},
    month = {02},
    abstract = "{Machine learning algorithms for link prediction can be valuable tools for hypothesis generation. However, many current algorithms are black boxes or lack good user interfaces that could facilitate insight into why predictions are made. We present LinkExplorer, a software suite for predicting, explaining and exploring links in large biomedical knowledge graphs. LinkExplorer integrates our novel, rule-based link prediction engine SAFRAN, which was recently shown to outcompete other explainable algorithms and established black box algorithms. Here, we demonstrate highly competitive evaluation results of our algorithm on multiple large biomedical knowledge graphs, and release a web interface that allows for interactive and intuitive exploration of predicted links and their explanations.A publicly hosted instance, source code and further documentation can be found at https://github.com/OpenBioLink/Explorer.Supplementary data are available at Bioinformatics online.}",
    issn = {1367-4803},
    doi = {10.1093/bioinformatics/btac068},
    url = {https://doi.org/10.1093/bioinformatics/btac068},
    note = {btac068},
    eprint = {https://academic.oup.com/bioinformatics/advance-article-pdf/doi/10.1093/bioinformatics/btac068/42447077/btac068.pdf},
}
```

This project received funding from [netidee](https://www.netidee.at/).
