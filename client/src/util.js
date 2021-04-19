
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
