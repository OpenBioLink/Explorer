// Performance measurement functions
var tictime;
function tic() { tictime = Date.now() }
function toc(msg) {
  var dt = Date.now() - tictime;
  console.log((msg || 'toc') + ": " + dt + "ms");
}

const variables = ["X", "Y", "A", "B", "C"];

exports.tic = tic;
exports.toc = toc;
exports.variables = variables;