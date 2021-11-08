import Dexie from 'dexie';

const db = new Dexie('Linkexplorer');
db.version(1).stores({
    entities: '++id',
    types: '++id',
    cache_key: 'key'
});

function setDB(entities, types, dataset, explanation){
    return new Promise((resolve) => {
        db.entities.clear();
        db.types.clear();
        db.cache_key.clear();
        let entities_ = []
        entities.forEach((element, index) => {
            entities_.push({id: element[0], label: element[1], types: element[2]})
        });
        let types_ = []
        types.forEach((element, index) => {
            types_.push({label: element})
        });
        db.entities.bulkAdd(entities_).then(() => {
            db.types.bulkAdd(types_).then(() => {
                db.cache_key.add({key: dataset + "_" + explanation})
                resolve();
            });
        });
    });
}

function isDBCached(dataset, explanation){
    return new Promise((resolve) => {
        if (db.cache_key == undefined){
            resolve(false);
        } else {
            db.cache_key.toCollection().first().then((row) => {
                if(row == undefined){
                    resolve(false);
                } else {
                    resolve(row.key == dataset + "_" + explanation);
                }
            })
        }
    });
}

export {db, setDB, isDBCached}