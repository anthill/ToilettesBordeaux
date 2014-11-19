'use strict';

var L = require('leaflet');
var U = require('./utilities.js');
var map = require('./initializeMap.js');

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

function drawToilettes(list){
	list.forEach(function(toilette){
		toiletGroup.addLayer(toilette.marker).addTo(map);
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
	],
    updateGeolocation() : void
}
*/

module.exports = function render(data){

	console.log('Data ', data);
	
	if (data.position){
		userGroup.clearLayers();

		var userPositionMarker = createUser(data.position);

		// Add click event on user position
		userPositionMarker.addEventListener('click', function(){
			data.updateGeolocation();
            infosGroup.clearLayers();
			render(data);
		});

		// draw marker
		userGroup.addLayer(userPositionMarker).addTo(map);
	}
	
	// draw data.toilettes
	if (data.toilettes){
		toiletGroup.clearLayers();
		drawToilettes(data.toilettes, data.position, data.infos);
	}

	// draw data.singleInfos
	if (data.singleInfos){
        throw new Error('use .infos');
	}

	// draw data.closestInfos
	if (data.closestInfos && !data.singleInfos){
        throw new Error('use .infos');
	}
    
    if(Array.isArray(data.infos)){
        drawInfos(data.infos);
		fitBounds(data.infos, data.position);
    }
	
};
