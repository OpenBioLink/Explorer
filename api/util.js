
// Performance measurement functions
var tictime;
function tic() { tictime = Date.now() }
function toc(msg) {
  var dt = Date.now() - tictime;
  console.log((msg || 'toc') + ": " + dt + "ms");
}

function logd(obj) {
  console.log(JSON.stringify(obj, null, 4))
}

const variables = ["X", "Y", "A", "B", "C"];

const namespace = "https://ai-strategies.org/kgc/"

function Code2URI(code){
  return namespace + encodeURI(code)
}

function URI2Code(uri){
  return decodeURI(uri.replace(namespace, ""))
}

exports.namespace = namespace;
exports.Code2URI = Code2URI;
exports.URI2Code = URI2Code;
exports.variables = variables;
exports.tic = tic;
exports.toc = toc;
exports.logd = logd;