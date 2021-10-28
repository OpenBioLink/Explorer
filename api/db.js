'use strict';
let queries = null;
if (typeof window === 'undefined') {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    queries = {
        connectToDB(db_id){
            return new Promise((resolve, reject) => {
                resolve(new Database(`./db/${db_id}.db`, { verbose: console.log }));
            });
        },
        all(db_id, sql){
            return new Promise((resolve, reject) => {
                this.connectToDB(db_id).then((db) => {
                    var rows = db.prepare(sql).all();
                    db.close();
                    resolve(rows);
                });
            });
        },
        get(db_id, sql){
            return new Promise((resolve, reject) => {
                this.connectToDB(db_id).then((db) => {
                    var rows = db.prepare(sql).get();
                    db.close();
                    resolve(rows);
                });
            });
        },
        run(db_id, sql){
            return new Promise((resolve, reject) => {
                this.connectToDB(db_id).then((db) => {
                    var rows = db.prepare(sql).run();
                    db.close();
                    resolve(rows);
                });
            });
        }
    }
} else {
    queries = {
        all(db_id, sql){
            return new Promise((resolve, reject) => {
                if (window.db == undefined){
                    window.location.href = "/loader";
                }
                let rows = [];
                var stmt = window.db.prepare(sql);
                while (stmt.step()){
                    rows.push(stmt.get())
                }
                stmt.free();
                resolve(rows);
            });
            
        },
        get(db_id, sql){
            if (window.db == undefined){
                window.location.href = "/loader";
            }
            return new Promise((resolve, reject) => {
                var stmt = window.db.prepare(sql);
                var rows = stmt.get();
                stmt.free();
                resolve(rows);
            });
        },
        run(db_id, sql){
            if (window.db == undefined){
                window.location.href = "/loader";
            }
            return new Promise((resolve, reject) => {
                var stmt = window.db.prepare(sql);
                var rows = stmt.run();
                stmt.free();
                resolve(rows);
            });
        }
    }
    
}

let dbMethods = {
    getAllTestEntities(explanationID){
        var sql = `
        select 
            distinct entity.Id, Name  
        from task 
        inner join entity on 
            entity.id = task.EntityID;
        `;
        return queries.all(explanationID, sql)
    },
    getTasksByCurie(explanationID, curie){
        var sql = `
        select 
            task.ID as TaskID, entity.Id as EntityID, entity.Name as EntityName, relation.Id as RelationID, relation.Name as RelationName, IsHead
        from task 
        inner join entity on 
            entity.id = task.EntityID
        inner join relation on 
            relation.id = task.RelationID
        where entity.Name = '${curie}';
        `
        return queries.all(explanationID, sql);
    },
    getTaskByID(explanationID, entityID){
        var sql = `
        select 
            task.ID as TaskID, entity.Id as EntityID, entity.Name as EntityName, relation.Id as RelationID, relation.Name as RelationName, IsHead
        from task 
        inner join entity on 
            entity.id = task.EntityID
        inner join relation on 
            relation.id = task.RelationID
        where task.ID = '${entityID}';
        `
        return queries.get(explanationID, sql);
    },
    getPredictionsByTaskID(explanationID, taskID){
        var sql = `
        select 
            entity.Id as EntityID, entity.Name as EntityName, prediction.confidence as Confidence, prediction.hit as Hit
        from prediction 
        inner join entity on 
            entity.id = prediction.EntityID
        where prediction.TaskID = ${taskID};
        `;
        return queries.all(explanationID, sql);
    },
    getPredictionByID(explanationID, taskID, entityID){
        var sql = `
        select 
            entity.Id as EntityID, entity.Name as EntityName, prediction.confidence as Confidence, prediction.hit as Hit
        from prediction 
        inner join entity on 
            entity.id = prediction.EntityID
        where prediction.TaskID = ${taskID}
        and prediction.EntityID = ${entityID};
        `;
        return queries.get(explanationID, sql);
    },
    getCurieByEntityID(explanationID, entityID){
        var sql = `
        select 
            name
        from entity 
        where id = ${entityID};
        `;
        return queries.get(explanationID, sql);
    },
    getExplanations(explanationID, taskID, entityID){
        var sql = `
        select 
            CASE
                WHEN (SELECT IsHead from Task WHERE Task.ID = ${taskID}) = 0 THEN Rule.HEAD_CLUSTER_ID
                ELSE Rule.TAIL_CLUSTER_ID 
            END AS ClusterID,
            Rule.ID as RuleID, 
            Rule.CONFIDENCE as RuleConfidence, 
            Rule.CORRECTLY_PREDICTED as RuleCorrectlyPredicted, 
            Rule.PREDICTED as RulePredicted, 
            Rule.DEF as RuleDefinition
        from Rule 
        inner join Rule_Entity on
            Rule.ID = Rule_Entity.RuleID
        where 
            Rule_Entity.TaskID = ${taskID}
            and Rule_Entity.EntityID = ${entityID}
        order by RuleConfidence desc;
        `;
        return queries.all(explanationID, sql);
    },
    getRuleByID(explanationID, ruleID){
        var sql = `
        select 
            *
        from Rule 
        where 
            Rule.ID = ${ruleID}
        `;
        return queries.get(explanationID, sql);
    }
}

exports.dbMethods = dbMethods;