import requests
import zipfile
import io
import sys
import os
from os.path import exists
import argparse

datasets = {
    "obl": "https://github.com/OpenBioLink/Utilities/raw/main/data/dataset-metadata-graphs/OBL/data.zip",
    "hetio": "https://github.com/OpenBioLink/Utilities/raw/main/data/dataset-metadata-graphs/Hetionet/data.zip",
    "pkl": "https://github.com/OpenBioLink/Utilities/raw/main/data/dataset-metadata-graphs/Pheknowlator/data.zip",
    "wn18rr": "https://github.com/OpenBioLink/Utilities/raw/main/data/dataset-metadata-graphs/WN18RR/data.zip",
    "yago310": "https://github.com/OpenBioLink/Utilities/raw/main/data/dataset-metadata-graphs/YAGO3-10/data.zip",
}

def get_config(namespace):
	return r"""com.bigdata.rdf.sail.truthMaintenance=false
com.bigdata.rdf.store.AbstractTripleStore.textIndex=false
com.bigdata.rdf.store.AbstractTripleStore.justify=false
com.bigdata.rdf.store.AbstractTripleStore.statementIdentifiers=true
com.bigdata.rdf.store.AbstractTripleStore.axiomsClass=com.bigdata.rdf.axioms.NoAxioms
com.bigdata.namespace.{ns}.spo.com.bigdata.btree.BTree.branchingFactor=1024
com.bigdata.rdf.sail.namespace={ns}
com.bigdata.rdf.store.AbstractTripleStore.quads=false
com.bigdata.rdf.store.AbstractTripleStore.geoSpatial=false
com.bigdata.namespace.{ns}.lex.com.bigdata.btree.BTree.branchingFactor=400
com.bigdata.journal.Journal.groupCommit=false
com.bigdata.rdf.sail.isolatableIndices=false""".format(ns = namespace)

if not exists('cache'):
    os.makedirs('cache')

def download_and_unzip(url):
    sys.stdout.write(url + '\n')
    with open('cache/data.zip', 'wb') as f:
        response = requests.get(url, stream=True)
        total = response.headers.get('content-length')
        if total is not None:
            downloaded = 0
            total = int(total)
            for data in response.iter_content(chunk_size=max(int(total/1000), 1024*1024)):
                downloaded += len(data)
                f.write(data)
                done = int(50*downloaded/total)
                sys.stdout.write('\r[{}{}]'.format('█' * done, '.' * (50-done)))
                sys.stdout.flush()
    with zipfile.ZipFile('cache/data.zip') as zfile:
        zfile.extractall('cache')
    

def setup(requested_datasets):
    for namespace, link in datasets.items():
        if namespace in requested_datasets:
            download_and_unzip(link)
            url = f"http://localhost:9999/blazegraph/namespace/{namespace}"

            print(f'DELETE {url}')
            r = requests.delete(url)
            print(f"Status: " + str(r.status_code))
            if r.status_code != 404:
                print(f"Text: " + r.text)
            else:
                print("No namespace to delete")
            
            print(f'CREATE {url}')
            r = requests.post('http://localhost:9999/blazegraph/namespace', headers={'Content-Type': 'text/plain'}, data=get_config(namespace))
            print(f"Status: " + str(r.status_code))
            print(f"Text: " + r.text)

            print(f'UPLOAD {url}')
            response = requests.post(f'{url}/sparql', headers={'Content-Type': 'application/x-turtle-RDR'}, data=open(f'cache/{namespace}.ttl','rb'))
            print(f"Status: " + str(response.status_code))
            print(f"Text: " + response.text)


class ArgParser(argparse.ArgumentParser):
    def __init__(self):
        super(ArgParser, self).__init__()
        self.add_argument('--datasets', type=str, default=["obl", "hetio", "pkl", "wn18rr", "yago310"], nargs='+',
                          help='a list of datasets')

    def parse_args(self):
        args = super().parse_args()
        return args

if __name__ == "__main__":
    args = ArgParser().parse_args()
    setup(args.datasets)



