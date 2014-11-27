'use strict';

var L = require('leaflet');

var U = require('./utilities.js');
var map = require('./initializeMap.js');
var geo = require('./geolocation.js');
var createInfos = require('./createInfos.js');
var findClosests = require('./findClosests.js');
var itinerary = require('./itCalculation.js');

var toiletGroup = new L.LayerGroup();
var userGroup = new L.LayerGroup();
var infosGroup = new L.LayerGroup();


function createUser(position){

	var icon = L.divIcon({
		className: "user",
		iconSize: new L.Point(72, 72),
		iconAnchor: new L.Point(36, 36),
		html: '<span class="fa-stack fa-lg fa-3x"><i class="fa fa-circle fa-stack-1x"></i><i class="fa fa-bullseye fa-stack-1x"></i></span>'
	});

	return new L.Marker(position, {icon: icon});
}

function drawToilet(toilet){
	// Add icons from FontAwesome
	var myHtml = '';

	if (toilet.class === 'sanitaire') {
		myHtml += '<i class="fa fa-female"></i><i class="fa fa-male"></i>\n';
	}
	else {
		myHtml += '<i class="fa fa-male urinoir"></i>\n';
	}
	
	if (toilet.handicap === true){
		myHtml += '<div class="pins"><i class="fa fa-fw fa-wheelchair"></i></div>\n';
	} 

	var icon = L.divIcon({
		className: "icon",
		iconSize: new L.Point(46, 46),
		iconAnchor: new L.Point(23, 23),
		html: myHtml
	});

	return L.marker([toilet.lat, toilet.lng], {icon: icon});
	
}

function drawToilettes(list, position){
	list.forEach(function(toilet){
		var marker = drawToilet(toilet);

		toiletGroup.addLayer(marker).addTo(map);
		if(position){
			marker.addEventListener('click', function(){

				itinerary(position, toilet)
					.then(function(result){

						render({
							toilettes: list,
							position: position,
							infos : [ createInfos(result, 1) ]
						});

					}).catch(function(err){console.error(err);});
			});
		}

	});
}

function drawInfos(infos){
	map.removeLayer(infosGroup);
	infosGroup.clearLayers();

	infos.forEach(function(info){
		infosGroup.addLayer(info.marker);
		infosGroup.addLayer(info.polyline);
	});

	infosGroup.addTo(map);
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

/* data :
{
	toilettes: Toilet[],
	position: { // user geolocation
		lng: number,
		lat: number
	},
	infos: [
		{
			marker: L.marker, 
			polyline: L.polyline
		}
	]
}
*/

function render(data){

	// console.log('Data ', data);
	
	if (data.position){
		console.log('Position found');
		// map.removeLayer(userGroup);
		userGroup.clearLayers();

		var userPositionMarker = createUser(data.position);

		// Add click event on user position
		userPositionMarker.addEventListener('click', function(){
			geo().getCurrentPosition()
				.then(function(position){
					return findClosests(data.toilettes, position);
				})
				.then(function(itineraries){
					var infos = itineraries.map(createInfos);

					render({
						toilettes: data.toilettes,
						position: data.position,
						infos: infos
					});

				});

			infosGroup.clearLayers();
		});

		// draw marker
		userGroup.addLayer(userPositionMarker).addTo(map);
	}
	
	// draw data.toilettes
	
	toiletGroup.clearLayers();
	drawToilettes(data.toilettes, data.position);
	
	
	if(Array.isArray(data.infos)){
		console.log('Fit bounds');
		drawInfos(data.infos);
		fitBounds(data.infos, data.position);
	}
	
}

module.exports = render;
