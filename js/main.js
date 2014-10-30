'use strict';

var L = require('leaflet');
var geo = require('./geolocation.js');
var itinerary = require('./itCalculation.js');
var getToilets = require('./getToilets.js');
var addInfos = require('./addInfos.js');
var U = require('./utilities.js');

// set map options
var BORDEAUX_COORDS = [44.84, -0.57];
var map = L.map('map', {
	center: BORDEAUX_COORDS,
	zoom: 12,
	minZoom: 12 // minZoom is set b/c there is no sense to zoom out of Bordeaux
});

map.setMaxBounds(map.getBounds()); // MaxBounds are set because there is no sense to pan out of Bordeaux

L.tileLayer('http://api.tiles.mapbox.com/v3/ourson.k0i572pc/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var typologieToCSSClass = {
	"Urinoir": "urinoir",
	"Sanitaire automatique": "sanitaire",
	"Sanitaire automatique avec urinoir": "sanitaire",
	"Chalet de nécessité": "sanitaire",
};

var iconMap = {
	"urinoir" : "male",
	"sanitaire": "female",
	"handicap": "wheelchair",
	"chalet": "umbrella"
};

var drawables = {
	singleGroup: L.layerGroup(),
	closestGroup: L.layerGroup(),
	urinoirGroup: L.layerGroup(),
	sanitaireGroup: L.layerGroup(),
	handiGroup: L.layerGroup(),
	toiletGroup: L.layerGroup()
};


// Get user position
function updatePosition(position){
 	var latitude  = position.coords.latitude;
	var longitude = position.coords.longitude;

	var icon = L.divIcon({
	        className: "user",
	        iconSize: new L.Point(72, 72),
		    iconAnchor: new L.Point(36, 36),
	        html: '<span class="fa-stack fa-lg fa-3x"><i class="fa fa-circle fa-stack-1x"></i><i class="fa fa-bullseye fa-stack-1x"></i></span>'
	    });

	var marker;

	if(marker)
		map.removeLayer(marker);

	marker = L.marker([latitude, longitude], {icon: icon});
	drawables.user = marker;

	// Add click event on user position
	marker.addEventListener('click', function(){
	    drawables.singleGroup.clearLayers();
	    drawables.closestGroup.addTo(map);
	});

	map.addLayer(marker);

	return {
		lat: latitude,
		lng: longitude
	}
}

var position = geo(updatePosition);

// Get toilets position
var toilettesP = getToilets('data/toilettes.json')
    .then(function(data){
        console.log('raw', data);
        
        return data["d"].map(function(t){
        	var test = typologieToCSSClass[t["typologie"]];
        	var option = t["options"] ? true: false;
        	if (!test)
        		console.error(t);
        	else {
        		return {
	                lng: parseFloat(t["x_long"]),
	                lat: parseFloat(t["y_lat"]),
	                nom: t["nom"],
	                // typologie: t["typologie"],
	                class: typologieToCSSClass[t["typologie"]],
	                handicap: option
            	};
        	}
        })
    });

// When user and toilet positions are available:
Promise.all([toilettesP, position]).then(function(values){

	var toilettes = values[0],
		position = values[1];

	var distance = 100000;

	toilettes.forEach(function(element){
		// Calculate rough distance b/w user and toilet
		element.d = Math.sqrt(Math.pow(element.lat - position.lat, 2) + Math.pow(element.lng - position.lng, 2));
		
		// Add icons from FontAwesome
		var myHtml = '';

		if (element.class == 'sanitaire') {
			myHtml += '<i class="fa fa-female"></i><i class="fa fa-male"></i>\n';
		}
		else {
			myHtml += '<i class="fa fa-male urinoir"></i>\n';
		}
		
		if (element.handicap == true){
			myHtml += '<div class="pins"><i class="fa fa-fw fa-wheelchair"></i></div>\n';
		} 

		var icon = L.divIcon({
	        className: "icon",
	        iconSize: new L.Point(46, 46),
		    iconAnchor: new L.Point(23, 23),
	        html: myHtml
	    });

	    var marker = L.marker([element.lat, element.lng], {icon: icon});
	    element.marker = marker;

	    // Add click event on toilet
	    marker.addEventListener('click', function(){
	    	map.removeLayer(drawables.closestGroup);
	    	drawables.singleGroup.clearLayers();

			itinerary(position, element)
			.then(function(result){
				return {
					result: result,
					toilet: element
				}
			})
			.then(function(result){
				var infos = addInfos(result, 1);

				infos.polyline.addTo(drawables.singleGroup);
				infos.marker.addTo(drawables.singleGroup);
				
				drawables.singleGroup.addTo(map);

			}).catch(function(err){console.error(err)})
		});

	    marker.addTo(drawables.toiletGroup);
	});

	// Sort toilets by rough distance
	toilettes.sort(function (a, b) {
		return (a.d - b.d);
	});

	var tempLats = [position.lat],
		tempLngs = [position.lng];

	var promises = [];

	// Calculate itineraries for 3 closest toilets
	for (var i = 0; i < 3; i++){
		var current = L.latLng(toilettes[i].lat, toilettes[i].lng);
		
		tempLats.push(current.lat);
		tempLngs.push(current.lng);

		promises[i] = itinerary(position, toilettes[i])
			.then(function(result){
				return {
					result: result,
					toilet: toilettes[i]
				}
			});
	}

	// Fits the map so all 3 shortest routes are displayed
	var north = U.getMaxOfArray(tempLats),
		south = U.getMinOfArray(tempLats),
		east = U.getMaxOfArray(tempLngs),
		west = U.getMinOfArray(tempLngs);

	var southWest = L.latLng(south, west),
    	northEast = L.latLng(north, east);
    
    var bounds = L.latLngBounds(southWest, northEast);
    map.fitBounds(bounds);

    // When all itineraries are computed
	var closeElements = Promise.all([promises[0], promises[1], promises[2]]).then(function(toilets){

		toilets.sort(function (a, b) {
			return (a.result.routes[0].legs[0].distance.value - b.result.routes[0].legs[0].distance.value);
		})

		for (var i = 2; i >= 0; i--){ // Downwards to get shortest route on top
			var infos = addInfos(toilets[i], i);
			infos.polyline.addTo(drawables.closestGroup);
			infos.marker.addTo(drawables.closestGroup);
		}

		// Draw infos on closest toilets
		drawables.closestGroup.addTo(map);
		

	}).catch(function(err){console.error(err)})

	// Draw all toilets
	drawables.toiletGroup.addTo(map);

}).catch(function(err){console.error(err)})



