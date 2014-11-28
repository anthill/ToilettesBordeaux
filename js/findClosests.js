'use strict';

var itinerary = require('./itCalculation.js');


module.exports = function(list, position){

	// console.log('list ', list);

	list.forEach(function(toilette){
		// Calculate rough distance b/w user and toilet
		toilette.d = Math.hypot(toilette.lat - position.lat, toilette.lng - position.lng);
	});

	list.sort(function (a, b) {
		return (a.d - b.d);
	});

	var closestToilettes = list.slice(0, 3);
	
	var closestLats = closestToilettes.map(function(t){return t.lat;}),
		closestLngs = closestToilettes.map(function(t){return t.lng;});

	closestLats.push(position.lat);
	closestLngs.push(position.lng);

	var itinerariesPs = closestToilettes.map(function(t){ return itinerary(position, t); });

	// When all itineraries are computed
	return Promise.all(itinerariesPs).then(function(itineraries){

		itineraries.sort(function (a, b) {
			return b.routes[0].legs[0].distance.value - a.routes[0].legs[0].distance.value;
		});

		return itineraries;

	}).catch(function(err){console.error(err);});
};
