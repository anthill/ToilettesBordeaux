'use strict';

var L = require('leaflet');

var BORDEAUX_COORDS = [44.84, -0.57];
var map = L.map('map').setView(BORDEAUX_COORDS, 12);

L.tileLayer('http://api.tiles.mapbox.com/v3/vallettea.hkjjf19g/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);