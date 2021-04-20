'use strict';

let queries = require('./db');

let db_explainations = {
    getAllTestEntities(explainationID){
        var sql = `
        select 
            distinct Name, entity.Id 
        from task 
        inner join entity on 
            entity.id = task.EntityID;
        `;
        return queries.all(explainationID, sql)
    },
    getTasksByCurie(explainationID, curie){
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
        return queries.all(explainationID, sql);
    },
    getTasksByEntityID(explainationID, entityID){
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
        return queries.all(explainationID, sql);
    },
    getTaskByID(explainationID, entityID){
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
        return queries.all(explainationID, sql);
    },
    getPredictionsByTaskID(explainationID, taskID){
        var sql = `
        select 
            entity.Id as EntityID, entity.Name as EntityName, prediction.confidence as Confidence, prediction.hit as Hit
        from prediction 
        inner join entity on 
            entity.id = prediction.EntityID
        where prediction.TaskID = ${taskID};
        `;
        return queries.all(explainationID, sql);
    },
    getCurieByEntityID(explainationID, entityID){
        var sql = `
        select 
            name
        from entity 
        where id = ${entityID};
        `;
        return queries.all(explainationID, sql)[0]["NAME"];
    },
    getExplainations(explainationID, taskID, entityID){
        var sql = `
        select 
            Rule.CLUSTER_ID as ClusterID,
            Rule.ID as RuleID, 
            Rule.CONFIDENCE as RuleConfidence, 
            Rule.DEF as RuleDefinition
        from Rule 
        inner join Rule_Entity on
            Rule.ID = Rule_Entity.RuleID
        where 
            Rule_Entity.TaskID = ${taskID}
            and Rule_Entity.EntityID = ${entityID}
        order by RuleConfidence desc;
        `;
        return queries.all(explainationID, sql);
    }
}

module.exports = db_explainations