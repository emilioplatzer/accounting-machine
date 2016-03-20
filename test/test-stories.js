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
                    var campos;
                    var datos;
                    var cdp = Promises.start();
                    content.split('\n').forEach(function(line){
                        cdp = cdp.then(function(){
                            switch(estado){
                            case 'log':
                                if(line.startsWith('#')){
                                    console.log(line);
                                };
                                if(line.startsWith('```asiento')){
                                    estado='asiento-primera-linea';
                                    datos=[];
                                }
                            break;
                            case 'asiento-primera-linea':
                                campos=(' '+line).split(/\s+/);
                                console.log('asiento',campos);
                                estado='asiento-datos';
                            break;
                            case 'asiento-datos':
                                if(line.startsWith('```')){
                                    console.log('test');
                                    estado='log';
                                    return am.agregarAsiento({campos, datos});
                                }else{
                                    datos.push((' '+line).split(/\s+/));
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