"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

var AccountingMachine = {};

var pg = require('pg-promise-strict');
const valoresEspeciales={
    '-':'null',
    '-':'null',
    '.':'null',
    '¬':'null',
    '”':'idem',
    '"':'idem',
};

AccountingMachine.combinar = function combinar(par){
    var rta=[];
    var anterior=[];
    return par.valores.map(function(valores){
        var registro={};
        valores.forEach(function(valor, index){
            var clave=par.claves[index];
            if(clave){
                switch(valoresEspeciales[valor]){
                case 'null': valor = null; break;
                case 'idem': valor = anterior[clave]; break;
                }
                registro[clave]=valor;
            }
        });
        anterior=registro;
        return registro;
    });
};


class Machine{
    constructor(db){
        this.db = db;
    }
    agregarAsiento(datos){
        console.log(datos);
    }
    obtenerSaldos(cortes){
        return ['saldos', cortes];
    }
}

AccountingMachine.Machine = Machine;

module.exports = AccountingMachine;
