"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

var AccountingMachine = {};

var _ = require('lodash');
var fs = require('fs-promise');

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

pg.originalConnect = pg.connect;
pg.connect = function(){
    return this.originalConnect.apply(this, arguments).then(function(dbClient){
        dbClient.executeSentences = function executeSentences(sentences){
            var cdp = Promises.start();
            sentences.forEach(function(sentence){
                cdp = cdp.then(function(){
                    if(!sentence.trim()) return;
                    return dbClient.query(sentence).execute().catch(function(err){
                        console.log('ERROR',err);
                        console.log(sentence);
                        throw err;
                    });
                });
            });
            return cdp;
        }
        dbClient.executeSqlScript = function executeSqlScript(fileName){
            return fs.readFile(fileName,'utf-8').then(function(content){
                var sentences = content.split('\n\n');
                return dbClient.executeSentences(sentences);
            });
        }
        return dbClient;
    });
}

AccountingMachine.installDbSchema = function installDbSchema(config, otherScripts){
    var dbClient;
    return Promises.start(function(){
        if(!config.testing){
            throw new Error('in production mode (!config.testing) installDbSchema is blocked');
        }
        return pg.connect(config.db);
    }).then(function(client){
        dbClient = client;
        var schema_name = config.db.schema;
        return dbClient.executeSentences(`
            drop schema if exists ${schema_name} cascade;
            create schema ${schema_name};
            SET search_path = ${schema_name};
        `.split(/\n\r?/));
    }).then(function(){
        return dbClient.executeSqlScript(require('path').dirname(__dirname)+'/install/create_main_schema_objects.sql');
    }).then(function(){
        return otherScripts && dbClient.executeSqlScript(otherScripts);
    }).then(function(){
        dbClient.done();
        
    });
}


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
    constructor(config){
        this.config = config;
    }
    getClientDb(){
        var am = this;
        var clientDb;
        return pg.connect(this.config.db).then(function(client){
            clientDb = client;
            clientDb.insertDb = insertDb;
        }).then(function(){
            return clientDb.query("SET search_path = "+am.config.db.schema+", public").execute();
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
    obtenerCuenta(filtro){
        var am = this;
        var clientDb;
        return Promises.start(function(){
            return am.getClientDb();
        }).then(function(client){
            clientDb = client;
        }).then(function(){
            var expresiones=[];
            var valores=[];
            var numero=1;
            _.forEach(filtro, function(valor, campo){
                expresiones.push(campo+" is not distinct from $"+numero)
                valores.push(valor);
                numero++;
            });
            return clientDb.query(
                'select fecha, cuenta, actor, comprobante, numero, '+
                'case when importe>0 then importe else null end as "importe+", '+
                'case when importe<0 then importe else null end as "importe-", '+
                'importe as acumulado, vencimiento, concepto, cantidad, precio, firmante '+
                'from movimientos '+
                'where '+expresiones.join(' and ')+
                'order by fecha, modif',
                valores
            ).fetchAll();
        }).then(function(result){
            clientDb.done();
            return result.rows;
        });
    }
    obtenerCuentas(){
        var am = this;
        var clientDb;
        return Promises.start(function(){
            return am.getClientDb();
        }).then(function(client){
            clientDb = client;
        }).then(function(){
            return clientDb.query(
                'select * from cuentas order by cuenta'
            ).fetchAll();
        }).then(function(result){
            clientDb.done();
            return result.rows;
        });
    }
}

AccountingMachine.Machine = Machine;

module.exports = AccountingMachine;
