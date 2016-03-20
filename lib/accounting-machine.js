"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

var AccountingMachine = {};

var pg = require('pg-promise-strict');

console.log(!!pg);

module.exports = AccountingMachine;
