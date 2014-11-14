'use strict';

var itinerary = require('./itCalculation.js');
var addInfos = require('./addInfos.js');
var render = require('./renderMap.js');

function findClosests(list, position){

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

	// console.log('list ', list);
	// console.log('position ', position);

	var itinerariesPs = closestToilettes.map(function(t){ return itinerary(position, t); });
	
	// var bounds = calculateBounds(closestLats, closestLngs);

	// When all itineraries are computed
	Promise.all(itinerariesPs).then(function(toilets){

		toilets.sort(function (a, b) {
			return -(a.routes[0].legs[0].distance.value - b.routes[0].legs[0].distance.value);
		});

		var infos = [];

		// Create itinerary infos for 3 closest toilets
		toilets.forEach(function(toilet, i){
			infos.push(addInfos(toilet, i));
		});

		render({
			toilettes: list,
			position: position,
			singleInfos: undefined,
			closestInfos: infos
		});

	}).catch(function(err){console.error(err);});
}


module.exports = findClosests;
