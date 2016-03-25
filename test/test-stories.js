"use strict";

require('fs-extra');
var fs = require('fs-promise');
var pg = require('pg-promise-strict');
var expect = require('expect.js');

var MiniTools = require('mini-tools');
var Promises = require('best-promise');
var changing = require('best-globals').changing;

if(process.version.match(/v0/)){
    var AccountingMachine = require('../lib/accounting-machine-es5.js');
    require("es6-shim");
    // require("node_modules/es6-transpiler/node_modules/es6-shim/es6-shim");
}else{
    var AccountingMachine = require('../lib/accounting-machine.js');
}

function cmpObjects (a,b){
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

var config;

pg.originalConnect = pg.connect;
pg.connect = function(){
    return this.originalConnect.apply(this, arguments).then(function(dbClient){
        dbClient.executeSentences = function executeSentences(sentences){
            var cdp = Promises.start();
            sentences.forEach(function(sentence){
                cdp = cdp.then(function(){
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

describe("manual", function(){    
    before(function(done){
        var dbClient;
        Promises.start(function(){
            return MiniTools.readConfig([
                'package',
                'def-test-config',
                'local-test-config'
            ]);
        }).then(function(configReaded){
            config = configReaded;
            return pg.connect(config.db);
        }).then(function(client){
            dbClient = client;
            return dbClient.executeSqlScript('./test/setup/create_test_schema.sql','utf-8');
        }).then(function(){
            return dbClient.executeSqlScript('./install/create_main_schema_objects.sql','utf-8');
        }).then(function(){
            dbClient.done();
        }).then(done,done);
    });
    it("combinar", function(){
        expect(AccountingMachine.combinar({
            claves:['cero','uno', 'dos', 'tres'],
            valores:[
                ['tres'  ,1   , '2', 'tres'  ],
                ['cuatro','-' , '.', 'cuatro'],
                ['”'     ,'¬' , '' , '”'     ],
                ['"'     ,'¬¬', '' , '"'     ]
            ]
        })).to.eql([
            {cero:'tres'  , uno:1   , dos:'2' , tres:'tres'  },
            {cero:'cuatro', uno:null, dos:null, tres:'cuatro'},
            {cero:'cuatro', uno:null, dos:''  , tres:'cuatro'},
            {cero:'cuatro', uno:''  , dos:''  , tres:'cuatro'}
        ])
    });
    it("control that fecha was Date", function(done){
        var am = new AccountingMachine.Machine(config.db);
        am.agregarAsiento({
            encabezado:{fecha:'3/3/2016'}, renglones:[]
        }).then(function(){
            done('must control Date type');
        },function(err){
            expect(err.message).to.match(/tipo invalido para fecha/);
            done();
        }).catch(done);
    });
});

describe("stories", function(){
    var dbClient;
    var dirName = "stories/";
    fs.readdirSync(dirName).forEach(function(fileName){
        if(fileName.endsWith('.md') && fileName=="explicacion-controles.md"){
            var am;
            beforeEach(function(done){
                Promises.start(function(){
                    return pg.connect(config.db);
                }).then(function(client){
                    dbClient = client;
                    return dbClient.query("delete from test.movimientos").execute();
                }).then(function(client){
                    return dbClient.query("delete from test.asientos").execute();
                }).then(function(){
                    am = new AccountingMachine.Machine(config.db);
                    dbClient.done();
                }).then(done,done);
            });
            it(fileName,function(done){
                fs.readFile(dirName+fileName, 'utf8').then(function(content){
                    var estado='log';
                    var claves;
                    var valores;
                    var cdp = Promises.start();
                    function split(line){
                        return (' '+line).trim().split(/\s+/);
                    }
                    var prefijoPendiente;
                    var prefijoInfo;
                    var operacion;
                    var operacionDef;
                    var operacionParams;
                    var operaciones={
                        asiento:{
                            conPrefijo:true,
                            hacer: function(am, claves, valores, params){
                                var encabezado = AccountingMachine.combinar(prefijoInfo)[0];
                                var renglones  = AccountingMachine.combinar({claves:claves, valores:valores}); 
                                console.log('asiento', encabezado.asiento);
                                var fallaEsperada=(encabezado.falla||'').replace(/_/g,' ');
                                if(fallaEsperada){
                                    delete encabezado.falla;
                                    return am.agregarAsiento({encabezado:encabezado, renglones:renglones}).then(
                                        function(){
                                            console.log('asiento', encabezado.asiento,'must fail:',fallaEsperada);
                                            throw new Error('Fail. Must throw: '+fallaEsperada);
                                        },
                                        function(err){
                                            expect(err.message).to.match(new RegExp(fallaEsperada));
                                        }
                                    );
                                }else{
                                    return am.agregarAsiento({encabezado:encabezado, renglones:renglones});
                                }
                            }
                        },
                        saldos :{
                            conPrefijo:null,
                            hacer: function(am, claves, valores, params){
                                return am.obtenerSaldos(params).then(function(saldos){
                                    expect(saldos.sort(cmpObjects)).to.eql(AccountingMachine.combinar({claves:claves, valores:valores}).sort(cmpObjects));
                                });
                            }
                        }
                    }
                    content.split('\n').forEach(function(line){
                        cdp = cdp.then(function(){
                            switch(estado){
                            case 'log':
                                if(line.startsWith('#')){
                                    console.log(line);
                                };
                                if(line.startsWith('```')){
                                    operacion = line.split(':')[0].substr(3);
                                    operacionParams = (line.split(':')[1]||'').split(',');
                                    operacionDef = operaciones[operacion];
                                    if(!operacionDef){
                                        done('code not valid: '+code);
                                    }else{
                                        estado='primera-linea';
                                        valores=[];
                                    }
                                    prefijoPendiente = operacionDef.conPrefijo;
                                    prefijoInfo = null;
                                }
                            break;
                            case 'primera-linea':
                                claves=split(line);
                                estado='valores';
                            break; 
                            case 'valores':
                                if(prefijoPendiente){
                                    prefijoInfo = {claves:claves, valores:[split(line)]};
                                    estado='primera-linea';
                                    prefijoPendiente=false;
                                }else if(line.startsWith('```')){
                                    estado='log';
                                    return operacionDef.hacer(am, claves, valores, operacionParams);
                                }else{
                                    valores.push(split(line));
                                }
                            break;
                            }
                        });
                    });
                    return cdp.then(function(){
                        console.log('listo');
                    }).then(done).catch(function(err){
                        console.log(err);
                        console.log(err.stack);
                        throw err;
                    });
                }).catch(done);
            });
        }
    });
});