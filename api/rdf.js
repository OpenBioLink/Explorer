'use strict';

const axios = require('axios');

const {variables, URI2Code, Code2URI, namespace, tic, toc}  = require('./util');

function runSPARQL(endpoint, query){
    console.log(query)
    return new Promise((resolve) => {
        tic()
        axios.post(
            endpoint, 
            encodeURI(query),
            {headers: {"Content-type": "application/x-www-form-urlencoded"}}
        ).then(function (response) {
            toc("Test");
            tic()
            resolve(response.data);
            toc("Test2");
        })
        .catch(function (error) {
            console.log(error);
        });
    });
}

let rdfMethods = {
    getAllTestEntities(endpoint){
        return new Promise((resolve, reject) => {

            var query = `query=
                    PREFIX obl:  <${namespace}>
                    SELECT ?value ?label (GROUP_CONCAT(?type;SEPARATOR=",") AS ?types)
                    WHERE { 
                    {
                        SELECT distinct ?value ?label 
                        WHERE {{ 
                        <<?value ?p ?o>> obl:split obl:test .
                        } UNION { 
                        <<?s ?p ?value>> obl:split obl:test .
                        }}
                    }
                    OPTIONAL{ ?value <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
                    OPTIONAL{ ?value a ?type .}
                    }
                    GROUP BY ?value ?label
                `
            var entitiesProm = runSPARQL(endpoint, query);
            
            query = `query=
                    SELECT distinct ?type
                    WHERE { 
                    ?s a ?type
                    }
                    ORDER BY ?type
                `
            var typesProm = runSPARQL(endpoint, query);


            Promise.all([entitiesProm, typesProm]).then(function (data) {
                var entities = data[0]["results"]["bindings"].map((x) => {
                    return [URI2Code(x["value"]["value"]), x["label"]?.value, x["types"]?.value.split(",")]
                });
                var types = data[1]["results"]["bindings"].map((x) => x["type"].value);
                resolve([entities, types])
            });
        });
    },
    addLabelsToPredictions(endpoint, predictions){
        return new Promise((resolve, reject) => {
            var query = `query=
                SELECT ?subject ?object
                WHERE {
                    ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object
                    VALUES ?subject {
                        ${predictions.map((elem)=>{return "<" + Code2URI(elem["EntityName"]) + ">"}).join(" ")}
                    }
                }
                `;
            runSPARQL(endpoint, query).then((data) => {
                var label_map = {};
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var triple = data["results"]["bindings"][i];
                    label_map[URI2Code(triple["subject"]["value"])] = triple["object"]["value"]
                }
                for(var i = 0; i < predictions.length; i++){
                    predictions[i].Label = label_map[predictions[i]["EntityName"]];
                }
                resolve(predictions);
            });
        });
    },
    addLabelsToExplanations(endpoint, groups, variables, entities, relations){
        return new Promise((resolve, reject) => {
            var query = `query=
                SELECT ?subject ?object
                WHERE {
                    ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?object
                    VALUES ?subject {
                        ${[...entities, ...relations].map((elem)=>{return "<" + Code2URI(elem) + ">"}).join(" ")}
                    }
                }
                `
            runSPARQL(endpoint, query).then((data) => {
                var label_map = {};
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var triple = data["results"]["bindings"][i];
                    label_map[URI2Code(triple["subject"]["value"])] = triple["object"]["value"]
                }

                groups.forEach((element) => {
                    element.Rules.forEach((rule) => {
                        if(!(variables.includes(rule.Definition.head))){
                            rule.Definition.headLabel = label_map[rule.Definition.head];
                        }
                        if(!(variables.includes(rule.Definition.tail))){
                            rule.Definition.tailLabel = label_map[rule.Definition.tail];
                        }
                        rule.Definition.relationLabel = label_map[rule.Definition.relation];
                        rule.Definition.bodies.forEach((body)=>{
                            if(!(variables.includes(body.head))){
                                body.headLabel = label_map[body.head];
                            }
                            if(!(variables.includes(body.tail))){
                                body.tailLabel = label_map[body.tail];
                            }
                            body.relationLabel = label_map[body.relation];
                        })

                        let bodies_ = rule.Definition.bodies;
                        let bodies = [];
                        bodies_.forEach((body)=>{
                            // why no [-1] javascript?
                            let lastIdx = bodies.length - 1;
                            if(lastIdx >= 0 && (bodies[lastIdx].relationLabel.startsWith("shares") || bodies[lastIdx].relationLabel.startsWith("ancestor") || bodies[lastIdx].relationLabel.startsWith("children"))){
                                bodies.push(body);
                            // B r A, B r C → A shares heads of r with C
                            } else if(lastIdx >= 0 && bodies[lastIdx].relation == body.relation && bodies[lastIdx].head == body.head && variables.includes(body.head)){
                                bodies[lastIdx].head = bodies[lastIdx].tail
                                bodies[lastIdx].headLabel = bodies[lastIdx].tailLabel
                                bodies[lastIdx].relationLabel = "shares head/s of \(" + (bodies[lastIdx].relationLabel? bodies[lastIdx].relationLabel : bodies[lastIdx].relation) + "\) with"
                                bodies[lastIdx].tail = body.tail
                                bodies[lastIdx].tailLabel = body.tailLabel
                            // A r B, C r B → A shares tails of r with C
                            } else if (lastIdx >= 0 && bodies[lastIdx].relation == body.relation && bodies[lastIdx].tail == body.tail && variables.includes(body.tail)){
                                bodies[lastIdx].head = bodies[lastIdx].head
                                bodies[lastIdx].headLabel = bodies[lastIdx].headLabel
                                bodies[lastIdx].relationLabel = "shares tail/s of \(" + (bodies[lastIdx].relationLabel? bodies[lastIdx].relationLabel : bodies[lastIdx].relation) + "\) with"
                                bodies[lastIdx].tail = body.head
                                bodies[lastIdx].tailLabel = body.headLabel
                           // A r B, B r C → A r children (degree 1) C
                            } else if (lastIdx >= 0 && bodies[lastIdx].relation == body.relation && bodies[lastIdx].tail == body.head){
                                if (bodies[lastIdx].relationLabel.includes(" degree ")){
                                    let levelIdx = bodies[lastIdx].relationLabel.search(" degree ") + 8
                                    let level = parseInt(bodies[lastIdx].relationLabel[levelIdx]) + 1
                                    bodies[lastIdx].relationLabel = bodies[lastIdx].relationLabel.substring(0, levelIdx) + level + bodies[lastIdx].relationLabel.substring(levelIdx + 1)
                                } else {
                                    bodies[lastIdx].relationLabel = "children degree 1 \(" + (bodies[lastIdx].relationLabel? bodies[lastIdx].relationLabel : bodies[lastIdx].relation) + "\)"
                                }
                                bodies[lastIdx].head = bodies[lastIdx].head
                                bodies[lastIdx].headLabel = bodies[lastIdx].headLabel
                                bodies[lastIdx].tail = body.tail
                                bodies[lastIdx].tailLabel = body.tailLabel
                            // B r A, C r B → A r ancestor (degree 1) C
                            } else if (lastIdx >= 0 && bodies[lastIdx].relation == body.relation && bodies[lastIdx].head == body.tail){
                                if (bodies[lastIdx].relationLabel.includes(" degree ")){
                                    let levelIdx = bodies[lastIdx].relationLabel.search(" degree ") + 8
                                    let level = parseInt(bodies[lastIdx].relationLabel[levelIdx]) + 1
                                    bodies[lastIdx].relationLabel[levelIdx] = level
                                } else {
                                    bodies[lastIdx].relationLabel = "ancestor degree 1 \(" + (bodies[lastIdx].relationLabel? bodies[lastIdx].relationLabel : bodies[lastIdx].relation) + "\)"
                                }
                                bodies[lastIdx].head = bodies[lastIdx].tail
                                bodies[lastIdx].headLabel = bodies[lastIdx].tailLabel
                                bodies[lastIdx].tail = body.head
                                bodies[lastIdx].tailLabel = body.headLabel
                            }
                            else {
                                bodies.push(body);
                            }
                        });
                        rule.Definition.bodies = bodies
                    })
                });
                resolve(groups);
            });
        });
    },
    getInfoByCurie(endpoint, curie){
        return new Promise((resolve, reject) => {
            var query = `query=
                SELECT ?label ?comment ?wwwresource (GROUP_CONCAT(?type;SEPARATOR=",") AS ?types)
                WHERE {
                    <${Code2URI(curie)}> <http://www.w3.org/2000/01/rdf-schema#label> ?label .
                    OPTIONAL {<${Code2URI(curie)}> <http://www.w3.org/2000/01/rdf-schema#comment> ?comment .}
                    OPTIONAL {<${Code2URI(curie)}> <https://ai-strategies.org/kgc/wwwresource> ?wwwresource .}
                    OPTIONAL {<${Code2URI(curie)}> a ?type .}
                }
                GROUP BY ?label ?comment ?wwwresource
                `

            runSPARQL(endpoint, query).then((data) => {
                tic()
                var edge = data["results"]["bindings"][0];
                var res = {
                    Label: edge?.label?.value,
                    Description: edge?.comment?.value,
                    Synonyms: [],
                    Labels: edge?.types?.value.split(","),
                    Curie: curie,
                    FullURI: edge?.wwwresource?.value,
                }
                toc("Blubb");
                resolve(res);

                

                /*
                Synonyms were removed
                var query = `query=
                SELECT ?synonym
                WHERE {
                    OPTIONAL {<${Code2URI(curie)}> <http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?synonym .}
                }`
                runSPARQL(endpoint, query).then((data) => {
                    if(Object.entries(data["results"]["bindings"][0]).length > 0){
                        for(var i = 0; i < data["results"]["bindings"].length; i++){
                            var edge = data["results"]["bindings"][i];
                            res.Synonyms.push(edge["synonym"]["value"]);
                        }
                    }
                */
            });
        });
    },
    getRelationlabel(endpoint, relation){
        return new Promise((resolve, reject) => {
            var query = `query=
                SELECT ?label
                WHERE {
                    <${Code2URI(relation)}> <http://www.w3.org/2000/01/rdf-schema#label> ?label .
                }
                `
            runSPARQL(endpoint, query).then((data) => {
                var edge = data["results"]["bindings"][0];
                var res = {
                    Label: edge?.label?.value,
                }
                resolve(res);
            });
        });
    },
    addRelationlabelsToTasks(endpoint, tasks){
        return new Promise((resolve, reject) => {
            var query = `query=
                SELECT ?subject ?label
                WHERE {
                    ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?label .
                    VALUES ?subject {
                        ${[...tasks].map((elem)=>{return "<" + Code2URI(elem.RelationName) + ">"}).join(" ")}
                    }
                }
                `
            

            runSPARQL(endpoint, query).then((data) => {
                var label_map = {};
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var triple = data["results"]["bindings"][i];
                    label_map[URI2Code(triple["subject"]["value"])] = triple["label"]["value"]
                }

                tasks.forEach((task) => {
                    task.RelationLabel = label_map[task.RelationName];
                });
                resolve(tasks);
            });
        });
    },
    getOutgoingEdges(endpoint, curie){
        return new Promise((resolve, reject) => {
            var res = new Proxy({}, {get(target, name){
                if(name === "toJSON" || name === "then"){
                    return undefined;
                } else if(!target.hasOwnProperty(name)){
                    target[name] = []
                }
                return target[name]
            }});

            var query = `query=
                PREFIX obl:  <${namespace}>
                SELECT ?predicate ?object ?label ?rellabel
                WHERE {
                    <<<${Code2URI(curie)}> ?predicate ?object>> obl:split obl:train .
                    OPTIONAL{ ?object <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
                    OPTIONAL{ ?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?rellabel .}
                }
                `
            runSPARQL(endpoint, query).then((data) => {
                if(data["results"]["bindings"].length > 0 && Object.entries(data["results"]["bindings"][0]).length > 0){
                    for(var i = 0; i < data["results"]["bindings"].length; i++){
                        var edge = data["results"]["bindings"][i];
                        res[URI2Code(edge["predicate"]["value"])].push([edge["rellabel"]["value"], edge["label"]?.value, URI2Code(edge["object"]["value"])]);
                    }   
                }           
                resolve(res);
            });
        });
    },
    getIncomingEdges(endpoint, curie){
        return new Promise((resolve, reject) => {
            var res = new Proxy({}, {get(target, name){
                if(name === "toJSON" || name === "then"){
                    return undefined;
                } else if(!target.hasOwnProperty(name)){
                    target[name] = []
                }
                return target[name]
            }});

            var query = `query=
                PREFIX obl:  <${namespace}>
                SELECT ?subject ?predicate ?label ?rellabel
                WHERE {
                    <<?subject ?predicate <${Code2URI(curie)}>>> obl:split obl:train .
                    OPTIONAL{ ?subject <http://www.w3.org/2000/01/rdf-schema#label> ?label .}
                    OPTIONAL{ ?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?rellabel .}
                }
                `
            runSPARQL(endpoint, query).then((data) => {
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var edge = data["results"]["bindings"][i];
                    res[URI2Code(edge["predicate"]["value"])].push([edge["rellabel"]["value"], edge["label"]["value"], URI2Code(edge["subject"]["value"])]);
                }
                resolve(res);
            });
        });
    },
    getInstantiations(endpoint, head, tail, rule){
        return new Promise((resolve, reject) => {
            var used_variables = new Set();

            function getEntity(entity){
                if(!variables.includes(entity)){
                    return "<" + Code2URI(entity) + ">";
                } else if(entity === "X"){
                    return "<" + Code2URI(head) + ">";
                } else if(entity === "Y") {
                    return "<" + Code2URI(tail) + ">";
                } else {
                    used_variables.add(entity);
                    return "?" + entity + "_"
                }
            }
            function getRelation(relation){
                return "<" + Code2URI(relation) + ">";
            }

            var where = "";
            rule.bodies.forEach((element) => {
                where = where + "<<" + getEntity(element.head) + " " + getRelation(element.relation) + " " + getEntity(element.tail) + ">> obl:split obl:train . \n";
            });

            used_variables.forEach((element) => {
                where = where + "OPTIONAL { ?" + element + "_ <http://www.w3.org/2000/01/rdf-schema#label> " + "?" + element + " . }\n"
            });

            var query = `query=
                PREFIX obl:  <${namespace}>
                SELECT ${[...used_variables].map(x => "?" + x).join(" ")} ${[...used_variables].map(x => "?" + x + "_").join(" ")}
                WHERE {
                    ${where}
                }
            `
            runSPARQL(endpoint, query).then((data) => {
                var res = [];
                for(var i = 0; i < data["results"]["bindings"].length; i++){
                    var edge = data["results"]["bindings"][i];
                    var instantiation = [];
                    used_variables.forEach((element) => {
                        var variable = {};
                        variable.variable = element;
                        variable.label = edge[element]?.value;
                        variable.curie = URI2Code(edge[element + "_"]["value"]);
                        instantiation.push(variable);
                    });
                    res.push(instantiation);
                }
                //callback(data["results"]["bindings"])
                resolve(res);
            });
        });
    }
}

exports.rdfMethods = rdfMethods;