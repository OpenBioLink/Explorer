// Performance measurement functions
var tictime;
function tic() { tictime = Date.now() }
function toc(msg) {
  var dt = Date.now() - tictime;
  console.log((msg || 'toc') + ": " + dt + "ms");
}

exports.tic = tic;
exports.toc = toc;