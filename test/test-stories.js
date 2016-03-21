"use strict";

require('fs-extra');
var fs = require('fs-promise');
var pg = require('pg-promise-strict');
var expect = require('expect.js');
var MiniTools = require('mini-tools');
var Promises = require('best-promise');

var AccountingMachine = require('../lib/accounting-machine.js');

function cmpObjects (a,b){
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

describe("stories", function(){
    var config;
    var dbClient;
    it("combinar", function(){
        expect(AccountingMachine.combinar({
            claves:['cero','uno', 'dos', 'tres'],
            valores:[
                ['tres'  ,1  , '2', 'tres'  ],
                ['cuatro','-', '.', 'cuatro'],
                ['”'     ,'¬', '' , '”'     ],
                ['"'     ,'¬', '' , '"'     ]
            ]
        })).to.eql([
            {cero:'tres'  , uno:1   , dos:'2' , tres:'tres'  },
            {cero:'cuatro', uno:null, dos:null, tres:'cuatro'},
            {cero:'cuatro', uno:null, dos:''  , tres:'cuatro'},
            {cero:'cuatro', uno:null, dos:''  , tres:'cuatro'}
        ])
    });
    before(function(done){
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
            dbClient.query("delete from test.movimientos").execute();
        }).then(done,done);
    });
    var dirName = "stories/";
    fs.readdirSync(dirName).forEach(function(fileName){
        if(fileName.endsWith('.md')){
            var am;
            before(function(done){
                am = new AccountingMachine.Machine(config.db);
                done();
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
                    var operacion;
                    var operacionDef;
                    var operacionParams;
                    var operaciones={
                        asiento:{hacer: function(am, claves, valores, params){
                            return am.agregarAsiento({claves, valores});
                        }},
                        saldos :{hacer: function(am, claves, valores, params){
                            return am.obtenerSaldos(params).then(function(saldos){
                                expect(saldos.sort(cmpObjects)).to.eql(AccountingMachine.combinar({claves, valores}).sort(cmpObjects));
                            });
                        }}
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
                                }
                            break;
                            case 'primera-linea':
                                claves=split(line);
                                estado='valores';
                            break; 
                            case 'valores':
                                if(line.startsWith('```')){
                                    estado='log';
                                    return operacionDef.hacer(am, claves, valores, operacionParams);
                                }else{
                                    valores.push(split(line));
                                }
                            break;
                            }
                        });
                    });
                    cdp.then(function(){
                        console.log('listo');
                        done();
                    }).catch(done);
                }).catch(done);
            });
        }
    });
});