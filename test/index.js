"use strict";

var exec = require('child_process').exec;

var TEST_PORT = 9184;

var serverProcess = exec('./node_modules/.bin/devserver -p '+TEST_PORT);
//serverProcess.stdout.pipe(process.stdout);
//serverProcess.stderr.pipe(process.stderr);



function theEnd(code){
    console.log('casper process exit with code', code);
    serverProcess.on('exit', function(){
        process.exit(code);
    });
    serverProcess.kill();
}

// data event is used as signal that the server is up and ready to receive requests
serverProcess.stdout.once('data', function(){
    console.log('server up on port', TEST_PORT);
    
    var casperProcess = exec('./node_modules/.bin/casperjs test test/casper');
    
    casperProcess.stdout.pipe(process.stdout);
    casperProcess.stderr.pipe(process.stderr);
    casperProcess.on('exit', theEnd);
    casperProcess.on('uncaughtException', theEnd);
    
    console.log('process, server, casper', process.pid, serverProcess.pid, casperProcess.pid);
    
});
