"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

var AccountingMachine = {};

var pg = require('pg-promise-strict');

class Machine{
    constructor(db){
        this.db = db;
    }
    agregarAsiento(datos){
        console.log(datos);
    }
}

AccountingMachine.Machine = Machine;

module.exports = AccountingMachine;
