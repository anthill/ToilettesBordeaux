'use strict';
var mapF = require('./mapFunctions.js')();
var itinerary = require('./itCalculation.js');
var addInfos = require('./addInfos.js');


function activateToiletSelection(list, position){
	list.forEach(function(toilette){

		// Add click event on toilet
		toilette.marker.addEventListener('click', function(){
			itinerary(position, toilette)
				.then(function(result){
					mapF.drawables.singleGroup.clearLayers();
					
					var infos = addInfos(result, 1);

					infos.polyline.addTo(mapF.drawables.singleGroup);
					infos.marker.addTo(mapF.drawables.singleGroup);
					
					mapF.displayItinerary(mapF.drawables.singleGroup);

				}).catch(function(err){console.error(err);});
		});
	});
}

function find3Closests(list, position){

	mapF.drawables.singleGroup.clearLayers();
	mapF.drawables.closestGroup.clearLayers();

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
	
	var bounds = mapF.calculateBounds(closestLats, closestLngs);

	// When all itineraries are computed
	Promise.all(itinerariesPs).then(function(toilets){

		toilets.sort(function (a, b) {
			return -(a.routes[0].legs[0].distance.value - b.routes[0].legs[0].distance.value);
		});

		// Calculate itineraries for 3 closest toilets
		toilets.forEach(function(toilet, i){

			var infos = addInfos(toilet, i);
			infos.polyline.addTo(mapF.drawables.closestGroup);
			infos.marker.addTo(mapF.drawables.closestGroup);

		});

		// Draw infos on closest toilets
		mapF.displayItinerary(mapF.drawables.closestGroup, bounds);

	}).catch(function(err){console.error(err);});
}


module.exports = {
	activateToiletSelection: activateToiletSelection,
	find3Closests: find3Closests
};
