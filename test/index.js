"use strict";

var exec = require('child_process').exec;
var kill = require('tree-kill');

var TEST_PORT = 9184;

var serverProcess = exec('./node_modules/.bin/devserver -p '+TEST_PORT);

function theEnd(code){
    console.log('casper process exit with code', code);
    serverProcess.on('exit', function(){
        process.exit(code);
    });
    // for yet unknown reasons, killing only the serverProcess isn't enough. 
    // another process sticks around listening on the testing port.
    // killing tree process consequently.
    kill(serverProcess.pid);
}

// data event is used as signal that the server is up and ready to receive requests
serverProcess.stdout.once('data', function(){
    console.log('test server up on port', TEST_PORT);
    
    var casperProcess = exec('./node_modules/.bin/casperjs test test/casper');
    
    casperProcess.stdout.pipe(process.stdout);
    casperProcess.stderr.pipe(process.stderr);
    casperProcess.on('exit', theEnd);
    casperProcess.on('uncaughtException', theEnd);
    
});
