"use strict";

var entrypoint = {"path": "lib", "name": "accounting-machine.js"}

if(process.version.match(/v0/)){
    require("es6-shim");
    entrypoint.path += '-trans';
}

module.exports = require('./'+entrypoint.path+'/'+entrypoint.name);
