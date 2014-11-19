'use strict';

var L = require('leaflet');

var BORDEAUX_COORDS = [44.84, -0.57];

// set map options
var map = L.map('map', {
	center: BORDEAUX_COORDS,
	zoom: 12,
	minZoom: 12 // minZoom is set b/c there is no sense to zoom out of Bordeaux
});

map.setMaxBounds(map.getBounds()); // MaxBounds are set because there is no sense to pan out of Bordeaux

L.tileLayer('http://api.tiles.mapbox.com/v3/ourson.k0i572pc/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

module.exports = map;
