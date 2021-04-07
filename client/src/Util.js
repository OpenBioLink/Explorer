import axios from 'axios';
import initSqlJs from "sql.js";
const $rdf = require('rdflib')

window.DB = null;
window.graph = null;

window.SPARQLUrl = 'http://localhost:3030/FB/sparql';
window.ns = "http://g.co/kg";

function error(e) {
	console.log(e);
}

export function initDB(f, callback){
    tic();
    var r = new FileReader();
    r.onload = function() {
      var Uints = new Uint8Array(r.result);
      initSqlJs({
        // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
        // You can omit locateFile completely when running in node
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.4.0/dist/${file}`
      }).then(function (SQL) {
        window.DB = new SQL.Database(Uints);
        toc("Loaded database");
        callback();
      }).catch(err => error(err));
    }
    r.readAsArrayBuffer(f);
}

export function execDB(sql) {
  let results = null;
  try {
    // The sql is executed synchronously on the UI thread. 
    // You may want to use a web worker
    results = window.DB.exec(sql); // an array of objects is returned
  } catch (e) {
    // exec throws an error when the SQL statement is invalid
    error(e);
  }
  return results
}

function query_entities(callback){
  var sql = `
      select 
          distinct Name, entity.Id 
      from task 
      inner join entity on 
          entity.id = task.EntityID;
      `
  var entities = execDB(sql);
  callback(entities);
}

export function getTasksFromCurie(curie, callback){
  var sql = `
  select 
    task.ID, entity.Id, entity.Name, relation.Id, relation.Name, IsHead
  from task 
  inner join entity on 
    entity.id = task.EntityID
  inner join relation on 
    relation.id = task.RelationID
  where entity.Name = '${curie}';
  `
  var results = execDB(sql);
  results = results[0]["values"];
  var head_tasks = [];
  var tail_tasks = [];
  for(var i = 0; i < results.length; i++){
      if(results[i][5] == 1){
          head_tasks.push(results[i]);
      } else {
          tail_tasks.push(results[i]);
      }
  }
  callback(head_tasks, tail_tasks);
}

export function getPredictionsOfTaskID(taskID, callback){
  var sql = `
  select 
    entity.Id, entity.Name, prediction.confidence
  from prediction 
  inner join entity on 
    entity.id = prediction.EntityID
  where prediction.TaskID = ${taskID};
  `
  var results = execDB(sql);
  results = results[0]["values"];
  callback(results);
}

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
export function tic() { tictime = performance.now() }
export function toc(msg) {
  var dt = performance.now() - tictime;
  console.log((msg || 'toc') + ": " + dt + "ms");
}

var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#")
var OBO = $rdf.Namespace("http://www.geneontology.org/formats/oboInOwl#")

export function initGraph(f, callback){
    tic();
    var r = new FileReader();
    r.onload=function(){
        var body = r.result;
        var mimeType='application/rdf+xml'
        var uri = "https://ai-strategies.org/openbiolink.rdf"
        window.graph = $rdf.graph()
        try {
            $rdf.parse(body, window.graph, uri, mimeType)
        } catch (err) {
            console.log(err)
        }
        toc("Loaded graph");
        callback();
    }
    r.readAsText(f);
}

export function getLabel(entity, callback) {
  var ent = $rdf.sym(window.ns + entity);
  var label = window.graph.any(ent, RDFS('label'));
  if(label != null) return label.value
  return null
}

export function getInfoSPARQL(entity, callback) {
  var query = `query=
  SELECT ?predicate ?object
  WHERE {
    <${window.ns}${entity}> ?predicate ?object 
  }
  `
  tic();
  fetch(window.SPARQLUrl, {
    method: 'POST', 
    headers: {"Content-type": "application/x-www-form-urlencoded"},
    body: query
    })
    .then((response) => {
      return response.json()}
      )
    .then((json) => {
      console.log(json);
      var label = "";
      var description = "";
      var synonyms = [];

      for(var i = 0; i < json["results"]["bindings"].length; i++){
        var edge = json["results"]["bindings"][i];
        if(edge["predicate"]["value"] === "http://www.w3.org/2000/01/rdf-schema#label"){
          label = edge["object"]["value"];
        } else if(edge["predicate"]["value"] === "http://www.w3.org/2000/01/rdf-schema#comment"){
          description = edge["object"]["value"];
        } else if(edge["predicate"]["value"] === "http://www.geneontology.org/formats/oboInOwl#hasExactSynonym"){
          synonyms.push(edge["object"]["value"]);
        }
      }
      callback(label, description, synonyms);
    });
}

export function getLabelsSPARQL(tasks, callback) {
  /*
  var entity = result[0].values.slice(i,j).map(x => "<" + window.ns + x[0] + ">").join(", ");
  var query_ = `query=
    SELECT ?object 
    WHERE { <${window.ns}${entity}> <http://www.w3.org/2000/01/rdf-schema#label> ?object }
  `;

  var query = `query=
  SELECT ?subject ?object
  WHERE {
    ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object 
  }
  `
  */

  var query = `query=
  SELECT ?subject ?object
  WHERE {
    ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object 
  }
  `
  
  tic();
  fetch(window.SPARQLUrl, {
    method: 'POST', 
    headers: {"Content-type": "application/x-www-form-urlencoded"},
    body: query
    })
    .then((response) => {
      return response.json()}
      )
    .then((json) => {
      var label_map = {};
      for(var i = 0; i < json["results"]["bindings"].length; i++){
        var triple = json["results"]["bindings"][i];
        label_map[triple["subject"]["value"].replace(window.ns, '')] = triple["object"]["value"]
      }
      callback(label_map, tasks);
    });

    /*
  const Http = new XMLHttpRequest();
  Http.open("POST", encodeURI(window.SPARQLUrl));
  Http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  Http.send(query);
  Http.onreadystatechange = function(){
    if(this.readyState === 4 && this.status === 200){
      callback(Http.responseText);
    }
  }
  */
}

export function getSynonyms(entity) {
  var ent = $rdf.sym(window.ns + entity);
  var $synonyms = window.graph.each(ent, OBO('hasExactSynonym'));
  var synonyms = [];
  for (var i = 0; i < $synonyms.length; i++){
    synonyms.push($synonyms.value);
  }
  return synonyms;
}

export function getSynonymsSPARQL(result, i) {
  var entity = result[0].values[i][0];
  var query = `query=
    SELECT ?object 
    WHERE { <${window.ns}${entity}> <http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?object }
  `;

  fetch(window.SPARQLUrl, {
    method: 'POST', 
    headers: {"Content-type": "application/x-www-form-urlencoded"},
    body: query
    })
    .then((response) => {return response.json()})
    .then((json) => {
      if(json["results"]["bindings"].length > 0){
        result[0].values[i][3] = json["results"]["bindings"].map(x => x["object"]["value"]);
      }
    });

    /*
  const Http = new XMLHttpRequest();
  Http.open("POST", encodeURI(window.SPARQLUrl));
  Http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  Http.send(query);
  Http.onreadystatechange = function(){
    if(this.readyState === 4 && this.status === 200){
      callback(Http.responseText);
    }
  }
  */
}

export function searchSPARQL(s, callback) {

  var query = `query=
    SELECT ?subject ?object
    WHERE {
      ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object .
      FILTER regex(?object, ${s}, "i")
    }
    LIMIT 25
  `
  const Http = new XMLHttpRequest();
  Http.open("POST", encodeURI(window.SPARQLUrl));
  Http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  Http.send(query);
  Http.onreadystatechange = function(){
    if(this.readyState === 4 && this.status === 200){
      callback(Http.responseText);
    }
  }
}

export function getInfo(entity) {
  var ent = $rdf.sym(window.ns + entity);
  var label = window.graph.any(ent, RDFS('label'));
  var comment = window.graph.any(ent, RDFS('comment'));
  var synonyms = window.graph.each(ent, OBO('hasExactSynonym'));
}



