"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

var AccountingMachine = {};

var pg = require('pg-promise-strict');

var Promises = require('best-promise');

var valoresEspeciales={
    '-':'null',
    '-':'null',
    '.':'null',
    '¬':'null',
    '”':'idem',
    '"':'idem',
};

AccountingMachine.combinar = function combinar(par){
    var rta=[];
    var anterior={};
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
    constructor(configDb){
        this.configDb = configDb;
    }
    getClientDb(){
        var am = this;
        var clientDb;
        return pg.connect(this.configDb).then(function(client){
            clientDb = client;
        }).then(function(){
            return clientDb.query("SET search_path = "+am.configDb.schema+", public");
        }).then(function(){
            return clientDb;
        });
    }
    agregarAsiento(datos){
        var clientDb;
        var cdp = this.getClientDb().then(function(client){
            clientDb = client;
        });
        datos.renglones.forEach(function(renglon){
            var registro = changing(datos.encabezado, renglon);
            cdp = cdp.then(function(){
                return clientDb.query(
                    "insert into movimientos ("+
                    Object.keys(registro).map(JSON.stringify).join(', ')+
                    ") values ("+Object.keys(registro).map(function(_,index){ return '$'+(index+1); }).join(', ')+
                    ")",
                    Object.keys(registro).map(function(key){ return registro[key]; })
                ).execute();
            });
        });
        return cdp.then(function(){
            clientDb.done();
        });
    }
    obtenerSaldos(cortes){
        var am = this;
        var clientDb;
        return Promises.start(function(){
            return am.getClientDb();
        }).then(function(client){
            clientDb = client;
        }).then(function(){
            var corteFieldList = cortes.map(JSON.stringify).join(', ');
            return clientDb.query(
                "select "+corteFieldList+", sum(importe) as saldo from movimientos group by "+corteFieldList
            ).fetchAll();
        }).then(function(result){
            clientDb.done();
            return result.rows;
        });
    }
}

AccountingMachine.Machine = Machine;

module.exports = AccountingMachine;
