"use strict";

require('fs-extra');
var fs = require('fs-promise');
var pg = require('pg-promise-strict');
var expect = require('expect.js');
var MiniTools = require('mini-tools');
var Promises = require('best-promise');

var AccountingMachine = require('../lib/accounting-machine.js');

describe("stories", function(){
    var config;
    var dbClient;
    it("combinar", function(){
        expect(AccountingMachine.combinar({
            claves:['uno', 'dos', 'tres'],
            valores:[
                [1  , '2', 'tres'  ],
                ['-', '.', 'cuatro'],
                ['¬', '' , '”'     ]
            ]
        })).to.eql([
            {uno:1   , dos:'2' , tres:'tres'  },
            {uno:null, dos:null, tres:'cuatro'},
            {uno:null, dos:''  , tres:'cuatro'}
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
        }).then(done,done);
    });
    console.log('entro');
    var dirName = "stories/";
    fs.readdirSync(dirName).forEach(function(fileName){
        console.log('fn',fileName);
        if(fileName.endsWith('.md')){
            var am;
            before(function(done){
                am = new AccountingMachine.Machine(dbClient);
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
                    content.split('\n').forEach(function(line){
                        var operacion;
                        var operacionDef;
                        var operacionParams;
                        var operaiones={
                            asiento:{hacer: function(am, claves, valores, params){
                                return am.agregarAsiento({claves, valores});
                            }},
                            saldos :{hacer: function(am, claves, valores, params){
                                return am.obtenerSaldos(params).then(function(saldos){
                                    expect(saldos.sort()).to.eql(am.combinar({claves, valores}));
                                });
                            }}
                        }
                        cdp = cdp.then(function(){
                            switch(estado){
                            case 'log':
                                if(line.startsWith('#')){
                                    console.log(line);
                                };
                                if(line.startsWith('```')){
                                    var operacion = line.split(':')[0].substr(3);
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