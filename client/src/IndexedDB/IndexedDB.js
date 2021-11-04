import Dexie from 'dexie';

const db = new Dexie('ReactSampleDB');
db.version(1).stores({
    entities: 'id',
    types: 'id'
});

export default db;