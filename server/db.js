'use strict';

const Database = require('better-sqlite3');
const fs = require('fs');

function createIndex(){
    let db = new Database(`./db/index.db`, { verbose: console.log });

    sql = `
    CREATE TABLE "Dataset" (
        "ID"	TEXT NOT NULL,
        "Name"	TEXT NOT NULL,
        "Version"	TEXT,
        "Description"	TEXT,
        "Namespace"	TEXT NOT NULL,
        PRIMARY KEY("ID")
    );`
    db.prepare(sql).run(sql);
    sql = `
    CREATE TABLE "Explaination" (
        "ID"	TEXT NOT NULL,
        "DatasetID"	TEXT NOT NULL,
        "Label"	TEXT,
        "Date"	INTEGER NOT NULL,
        "Comment"	TEXT,
        "Method"	TEXT NOT NULL,
        "RuleConfig"	TEXT,
        "ClusteringConfig"	TEXT,
        PRIMARY KEY("ID"),
        FOREIGN KEY("DatasetID") REFERENCES "Dataset"("ID")
    );`
    db.prepare(sql).run(sql);
    sql = `
    CREATE TABLE "Temp_Dataset" (
        "ID"	TEXT NOT NULL,
        "Namespace"	TEXT NOT NULL,
        "Date"	INTEGER NOT NULL,
        PRIMARY KEY("ID")
    );
    `
    db.prepare(sql).run(sql);
    sql = `
    CREATE TABLE "Temp_Explaination" (
        "ID"	TEXT NOT NULL,
        "DatasetID"	TEXT NOT NULL,
        "Date"	INTEGER NOT NULL,
        PRIMARY KEY("ID")
    );`
    db.prepare(sql).run(sql);
    return db;
}

let queries = {
    connectToDB(db_id){
        if(fs.existsSync(`./db/${db_id}.db`)){
            return new Database(`./db/${db_id}.db`, { verbose: console.log });
        } else if(db_id == 'index'){
            return createIndex();
        }
    },
    all(db_id, sql){
        let db = this.connectToDB(db_id);
        var rows = db.prepare(sql).all();
        db.close();
        return rows
    },
    get(db_id, sql){
        let db = this.connectToDB(db_id);
        var rows = db.prepare(sql).get();
        db.close();
        return rows
    },
    run(db_id, sql){
        let db = this.connectToDB(db_id);
        var rows = db.prepare(sql).run();
        db.close();
        return rows
    }
}  

module.exports = queries;