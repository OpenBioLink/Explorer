import initSqlJs from "sql.js";

export function from_timestamp(timestamp){
    var d= new Date(timestamp * 1000);
    var datestring = ("0" + d.getDate()).slice(-2) + "." 
                + ("0"+(d.getMonth()+1)).slice(-2) + "."
                + d.getFullYear() + " " 
                + ("0" + d.getHours()).slice(-2) + ":" 
                + ("0" + d.getMinutes()).slice(-2);
    return datestring;
}

export function from_method_short(method_short){
    if(method_short === "nrno"){
        return "Non-redundant Noisy-OR";
    } else if(method_short === "no"){
        return "Noisy-OR";
    } else if(method_short === "max"){
        return "MaxPlus";
    }
}

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
export function tic() { tictime = performance.now() }
export function toc(msg) {
  var dt = performance.now() - tictime;
  console.log((msg || 'toc') + ": " + dt + "ms");
}

export function sortAsc(entities){
    // Sortieren nach Wert
    return entities.sort((a,b) => {
      var nameA = a[1];
      var nameB = b[1];
      
      var isNameA = !((nameA == null) || (nameA === ""))
      var isNameB = !((nameB == null) || (nameB === ""))

      if(!isNameA && isNameB){
        return 1;
      }
      else if(isNameA && !isNameB){
        return -1;
      }
      else if(isNameA && isNameB){
        nameA = nameA.toUpperCase();
        nameB = nameB.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        else if (nameA > nameB) {
          return 1;
        } else {
          return 0;
        }
      } else {
        return 0;
      }
    });
  }

export function sortDesc(entities){
    return entities.sort((a, b) =>{
      var nameA = a[1]; // Groß-/Kleinschreibung ignorieren
      var nameB = b[1]; // Groß-/Kleinschreibung ignorieren#

      var isNameA = !((nameA == null) || (nameA === ""))
      var isNameB = !((nameB == null) || (nameB === ""))

      if(!isNameA && isNameB){
        return -1;
      }
      else if(isNameA && !isNameB){
        return 1;
      }
      else if(isNameA && isNameB){
        nameA = nameA.toUpperCase();
        nameB = nameB.toUpperCase();
        if (nameA < nameB) {
          return 1;
        }
        else if (nameA > nameB) {
          return -1;
        }
        return 0;
      } else {
        return 0;
      }
    });
  }

export function ellipsis(string){
  const limit = 50;
  if (string.length > limit) {
    return string.substring(0,limit) + " ...";
  }
  return string;
}

export function datasetID2Endpoint(index, datasetID){
  if(datasetID.startsWith("local")){
    return datasetID;
  } else {
    return index["dataset"].find((_dataset) => _dataset["ID"] == datasetID)["Endpoint"]
  }
}


/*
I know its excessive to store this in a sqlite, but quota limits require me to.
TODO remove JSON serialization and store values directly
*/
export function setDB(entities, types){
  return new Promise((resolve) => {
    let config = {
      locateFile: file => `https://sql.js.org/dist/${file}`
    }
    // The `initSqlJs` function is globally provided by all of the main dist files if loaded in the browser.
    // We must specify this locateFile function if we are loading a wasm file from anywhere other than the current html page's folder.
    initSqlJs(config).then((SQL) => {
      window.entitiesdb = new SQL.Database();
      let create = "CREATE TABLE Entities(entities text, types text);"
      window.entitiesdb.run(create);
      let insert = `INSERT INTO Entities VALUES (?,?);`
      window.entitiesdb.run(insert, [JSON.stringify(sortAsc(entities)), JSON.stringify(sortAsc(types))]);
      resolve();
    });
  });
}

export function getEntitiesDB(){
  if (window.entitiesdb == undefined){
    return null;
  } else {
    const stmt = window.entitiesdb.prepare("SELECT entities FROM Entities;");
    stmt.step();
    const row = stmt.get();
    console.log(row);
    return JSON.parse(row);
  }
}
export function getTypesDB(){
  if (window.entitiesdb == undefined){
    return null;
  } else {
    const stmt = window.entitiesdb.prepare("SELECT types FROM Entities;");
    stmt.step()
    const row = stmt.get();
    console.log(row);
    return JSON.parse(row);
  }
}