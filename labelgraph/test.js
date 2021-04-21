'use strict';
const N3 = require('n3');

var star = `
@prefix : <http://example.org/> .

<<:bob :age 23>> :certainty 0.9 .
<<:bob :age 23>> :test 0.9 .
<<:alice :age 26>> :certainty 0.8 .
<<:john :age 25>> :certainty 0.7 .
<<:simon :age 21>> :certainty 0.4 .
<<:kathrin :age 24>> :certainty 0.5 .
`
var quads = [];
const parser = new N3.Parser({ format: 'turtlestar' });
parser.parse(star, (error, quad, prefixes) => {
    if (quad){
        console.log(quads.length);
        quads.push(quad);
    }
        
    else {
        const writer = new N3.Writer({ prefixes: { c: 'http://example.org/' }, format: 'turtlestar' });
        console.log(quads.length)
        writer.addQuads(quads);
        writer.end((error, result) => {console.log("HI");console.log(result)});
    }
        
  });

