
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

exports.variables = variables;
exports.tic = tic;
exports.toc = toc;
exports.logd = logd;