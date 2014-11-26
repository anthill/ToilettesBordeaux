"use strict";

var TEST_PORT = 9184;

casper.options.verbose = true;
casper.options.logLevel = 'debug';

casper.test.begin('UX with no geolocation', 1, function suite(test) {
    casper.start('http://localhost:'+TEST_PORT);
    
    casper.waitUntilVisible('.icon', function(){
        test.assertElementCount('.icon', 74, "there are 74 toilets on the map initially");
        test.done();
    }, function(){
        console.log('TIMEOUT!');
        console.log(this.getHTML('#map', true));
    });
});

casper.run();