'use strict';

var L = require('leaflet');
var U = require('./utilities.js');
var map = require('./initializeMap.js');
var itinerary = require('./itCalculation.js');
var addInfos = require('./addInfos.js');

/* data :
{
	toilettes: Toilet[],
	position: {
		long: number,
		lat: number
	},
	infos: [
	{
		marker: L.marker, 
		polyline: L.polyline
	},
	...]
}
*/

var toiletGroup = new L.LayerGroup();
var userGroup = new L.LayerGroup();
var closestGroup = new L.LayerGroup();
var singleGroup = new L.LayerGroup();


function createUser(position){

	var icon = L.divIcon({
		className: "user",
		iconSize: new L.Point(72, 72),
		iconAnchor: new L.Point(36, 36),
		html: '<span class="fa-stack fa-lg fa-3x"><i class="fa fa-circle fa-stack-1x"></i><i class="fa fa-bullseye fa-stack-1x"></i></span>'
	});

	return new L.Marker(position, {icon: icon});
}

function drawToilettes(list, position, closest){
	list.forEach(function(toilette){

		toiletGroup.addLayer(toilette.marker).addTo(map);

	});
}

function drawSingleInfos(infos){
	map.removeLayer(closestGroup);
	singleGroup.clearLayers();

	console.log('infos ', infos);

	infos.forEach(function(info){
		singleGroup.addLayer(info.marker);
		singleGroup.addLayer(info.polyline);
	});

	singleGroup.addTo(map);
}

function drawClosestInfos(infos){
	map.removeLayer(singleGroup);
	closestGroup.clearLayers();

	infos.forEach(function(info){
		closestGroup.addLayer(info.marker);
		closestGroup.addLayer(info.polyline);
	});

	closestGroup.addTo(map);
}

function calculateBounds(lats, lngs){
	// Fits the map so all shortest routes are displayed
	var north = U.getMaxOfArray(lats),
		south = U.getMinOfArray(lats),
		east = U.getMaxOfArray(lngs),
		west = U.getMinOfArray(lngs);

	var southWest = L.latLng(south, west),
		northEast = L.latLng(north, east);

	return L.latLngBounds(southWest, northEast);
}

function getLats(toilets, position){
	var lats = [position.lat];

	toilets.forEach(function(toilet){
		toilet.polyline._latlngs.forEach(function(latLng){
			lats.push(latLng.lat);
		});
	});
	
	return lats;
}

function getLngs(toilets, position){
	var lngs = [position.lng];

	toilets.forEach(function(toilet){
		toilet.polyline._latlngs.forEach(function(latLng){
			lngs.push(latLng.lng);
		});
	});
	
	return lngs;
}

function fitBounds(infos, position){
	var lats = getLats(infos, position);
	var lngs = getLngs(infos, position);

	var bounds = calculateBounds(lats, lngs);
	map.fitBounds(bounds, {
		paddingTopLeft: [10, 120],
		paddingBottomRight: [10, 20]
	});
} 

function render(data){

	console.log('Data ', data);
	
	if (data.position){
		userGroup.clearLayers();

		var marker = createUser(data.position);

		// Add click event on user position
		marker.addEventListener('click', function(){
			console.log('test');
			singleGroup.clearLayers();
			render({
				toilettes: data.toilettes,
				position: data.position,
				singleInfos: undefined,
				closestInfos: data.closestInfos
			});
		});

		// draw marker
		userGroup.addLayer(marker).addTo(map);
	}
	
	// draw data.toilettes
	if (data.toilettes){
		toiletGroup.clearLayers();
		drawToilettes(data.toilettes, data.position, data.closestInfos);
	}

	// draw data.singleInfos
	if (data.singleInfos){
		drawSingleInfos(data.singleInfos);
		fitBounds(data.singleInfos, data.position);
	}

	// draw data.closestInfos
	if (data.closestInfos && !data.singleInfos){
		drawClosestInfos(data.closestInfos);
		fitBounds(data.closestInfos, data.position);
	}
	
}

module.exports = render;
