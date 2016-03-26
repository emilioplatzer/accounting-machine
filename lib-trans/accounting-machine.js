"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

var AccountingMachine = {};

var _ = require('lodash');
var pg = require('pg-promise-strict');

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


var Machine = (function(){var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};
    function Machine(configDb){
        this.configDb = configDb;
    }DP$0(Machine,"prototype",{"configurable":false,"enumerable":false,"writable":false});
    proto$0.getClientDb = function(){
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
    };
    proto$0.agregarAsiento = function(datos){
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
            clientDb.done();
        },function(err){
            clientDb.done();
            throw err;
        });
    };
    proto$0.obtenerSaldos = function(cortes){
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
    };
MIXIN$0(Machine.prototype,proto$0);proto$0=void 0;return Machine;})();

AccountingMachine.Machine = Machine;

module.exports = AccountingMachine;
