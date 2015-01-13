"use strict";

var TEST_PORT = 9184;

casper.test.begin('Basic tests', 2, function suite(test) {
    casper.start('http://localhost:'+TEST_PORT, function() {
        test.assertTitle("Toilettes Bordeaux", "<title> should be 'Toilettes Bordeaux'");
        test.assertExists('#map', "div#map is in the document");
        test.done();
    });
});

casper.run();