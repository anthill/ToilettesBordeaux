'use strict';

var L = require('leaflet');
var geo = require('./geolocation.js');
var itinerary = require('./itCalculation.js');
var getToilets = require('./getToilets.js');
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
	map.addLayer(marker);
	map.center = L.latLng(latitude, longitude);

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
	    
	    map.addLayer(marker);
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
    Promise.all([promises[0], promises[1], promises[2]]).then(function(toilets){

		console.log('Les plus proches: ', toilets);
		
		toilets.sort(function (a, b) {
			return (a.result.routes[0].legs[0].distance.value - b.result.routes[0].legs[0].distance.value);
		})

		// Calculate itineraries for 3 closest toilets
		for (var i = 0; i < 3; i++){
			var result = toilets[i].result;
			var rank = '';
			var color = '#000000';

			if (i == 0){
				rank += 'first';
				color = '#008200';
			}
			
			// Get route points
			var destination = L.latLng(result.mc.destination.k, result.mc.destination.B);
			var route = result.routes[0];
			var path = route.overview_path;
			var routeLatLng = [];
			for (var j = 0; j < path.length; j++)
				routeLatLng[j] = {lat: path[j].k, lng: path[j].B};

			// Create and add infos on the route
			var minutes = Math.floor(route.legs[0].duration.value / 60);
			var secondes = route.legs[0].duration.value % 60;
			var time = minutes + "' "  + secondes + "\" ";
			var distance = route.legs[0].distance.value;

			var infos = L.divIcon({
		        className: ['infos', rank].join(' '),
		        iconSize: new L.Point(70, 70),
		        iconAnchor: new L.Point(35, 108),
		        html: time + '<div class="subInfos">' + distance + ' m </div>'
		    });
			
		    var marker = L.marker(destination, {icon: infos});
		    
		    map.addLayer(marker);

		    // Draw route
			var polyline = L.polyline(routeLatLng, {
				className: ['route', rank].join(' '),
				color: color,
				smoothFactor: 3.0,
            	noClip: true,
            	opacity: 1
			}).addTo(map);
		}

	}).catch(function(err){console.error(err)})

}).catch(function(err){console.error(err)})



