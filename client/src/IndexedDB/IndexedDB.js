import Dexie from 'dexie';

const db = new Dexie('Linkexplorer');
db.version(1).stores({
    entities: '++id',
    types: '++id'
});

function setDB(entities, types){
    return new Promise((resolve) => {
        db.entities.clear();
        db.types.clear();
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
                resolve();
            });
        });
    });
}

export {db, setDB}