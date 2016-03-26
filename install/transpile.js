"use strict";

var Path = require('path');

console.log('transpiling... accounting-machine');

require('es6-transpiler').run({
    filename: Path.dirname(__dirname)+'/lib/accounting-machine.js',
    outputFilename: Path.dirname(__dirname)+'/lib-trans/accounting-machine.js'
});
