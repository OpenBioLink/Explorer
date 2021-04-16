'use strict';

const Database = require('better-sqlite3');
const fs = require('fs');

let queries = {
    connectToDB(db_id){
        if(fs.existsSync(`./db/${db_id}.db`)){
            let db = new Database(`./db/${db_id}.db`, { verbose: console.log });
            return db;
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