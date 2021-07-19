'use strict';

let queries = require('./db');

let db_explanations = {
    getAllTestEntities(explanationID){
        var sql = `
        select 
            distinct Name, entity.Id 
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
    getTasksByEntityID(explanationID, entityID){
        var sql = `
        select 
            task.ID as TaskID, entity.Id as EntityID, entity.Name as EntityName, relation.Id as RelationID, relation.Name as RelationName, IsHead
        from task 
        inner join entity on 
            entity.id = task.EntityID
        inner join relation on 
            relation.id = task.RelationID
        where entity.ID = '${entityID}';
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
        return queries.all(explanationID, sql)[0]["NAME"];
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

module.exports = db_explanations