"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

var AccountingMachine = {};

var _ = require('lodash');
var pg = require('pg-promise-strict');
var readYaml = require('read-yaml-promise');

var changing = require('best-globals').changing;
var Promises = require('best-promise');

var valoresEspeciales={
    '-':'null',
    '.':'null',
    '¬':'null',
    '¬¬':'spc',
    '--':'spc',
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
                case 'null': valor = null           ; break;
                case 'spc' : valor = ''             ; break;
                case 'idem': valor = anterior[clave]; break;
                default: 
                    if(valor && (clave == 'fecha' || clave == 'vencimiento')){
                        valor = new Date(Date.UTC.apply(null,valor.split('/').reverse()));
                    }
                }
                registro[clave]=valor;
            }
        });
        anterior=registro;
        return registro;
    });
};

function insertDb(tabla, registro){
    return this.query(
        "insert into "+JSON.stringify(tabla)+" ("+
        Object.keys(registro).map(JSON.stringify).join(', ')+
        ") values ("+Object.keys(registro).map(function(_,index){ return '$'+(index+1); }).join(', ')+
        ")",
        Object.keys(registro).map(function(key){ return registro[key]; })
    ).execute().catch(function(err){
        console.log('INSERT ERROR OF:',tabla,registro);
        throw err;
    });
}

class Machine{
    constructor(configDb){
        this.configDb = configDb;
    }
    getClientDb(){
        var am = this;
        var clientDb;
        return pg.connect(this.configDb).then(function(client){
            clientDb = client;
            clientDb.insertDb = insertDb;
        }).then(function(){
            return clientDb.query("SET search_path = "+am.configDb.schema+", public").execute();
        }).then(function(){
            return clientDb;
        });
    }
    agregarAsiento(datos){
        var am = this;
        var clientDb;
        if(!(datos.encabezado.fecha instanceof Date)){
            return Promises.reject(new Error("tipo invalido para fecha"));
        }
        if(datos.encabezado.vencimiento && !(datos.encabezado.vencimiento instanceof Date)){
            return Promises.reject(new Error("tipo invalido para vencimiento"));
        }
        var cdp = this.getClientDb().then(function(client){
            clientDb = client;
        }).then(function(){
            return clientDb.query('BEGIN TRANSACTION').execute();
        }).then(function(){
            return clientDb.insertDb('asientos', _.pick(datos.encabezado, ['asiento', 'fecha']));
        });
        datos.renglones.forEach(function(renglon){
            var registro = changing(datos.encabezado, renglon);
            cdp = cdp.then(function(){
                return clientDb.insertDb('movimientos', registro);
            });
        });
        return cdp.then(function(){
            return clientDb.query('update asientos set borrador = null where asiento = $1', [datos.encabezado.asiento]).execute();
        }).then(function(){
            return clientDb.query('COMMIT').execute();
            clientDb.done();
        },function(err){
            var continueAnyWay=function(){
                clientDb.done();
                throw err;
            }
            return clientDb.query('ROLLBACK').execute().then(continueAnyWay,continueAnyWay);
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
                "select "+corteFieldList+", sum(importe) as saldo from movimientos group by "+corteFieldList+" having sum(importe)<>0"
            ).fetchAll();
        }).then(function(result){
            clientDb.done();
            return result.rows;
        });
    }
}

AccountingMachine.Machine = Machine;

module.exports = AccountingMachine;
