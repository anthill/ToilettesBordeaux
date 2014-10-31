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

var filteredToiletsP = [];

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
	};
}

function setMarker(toilet){
	// Add icons from FontAwesome
	var myHtml = '';
	var groups = [drawables.toiletGroup];

	if (toilet.class == 'sanitaire') {
		myHtml += '<i class="fa fa-female"></i><i class="fa fa-male"></i>\n';
		groups.push(drawables.sanitaireGroup);
	}
	else {
		myHtml += '<i class="fa fa-male urinoir"></i>\n';
		groups.push(drawables.urinoirGroup);
	}
	
	if (toilet.handicap == true){
		myHtml += '<div class="pins"><i class="fa fa-fw fa-wheelchair"></i></div>\n';
		groups.push(drawables.handiGroup);
	} 

	var icon = L.divIcon({
        className: "icon",
        iconSize: new L.Point(46, 46),
	    iconAnchor: new L.Point(23, 23),
        html: myHtml
    });

    toilet.marker = L.marker([toilet.lat, toilet.lng], {icon: icon});
    return groups;
}

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
	                handicap: option,
	                marker: undefined
            	};
        	}
        });
    });

// render points on map regardless of geolocation
toilettesP
	.then(function(toilettes){
	    toilettes.forEach(function(element){
			var groups = setMarker(element);

			groups.forEach(function(group){
				element.marker.addTo(group);
			});
			
		});
	    
	    drawables.toiletGroup.addTo(map);
	});


// var closestUrinoirs = undefined;
// var closestSanitaires = undefined;
// var closestHandis = undefined;

////////////////////// FONCTION GENERALE
var position = geo(updatePosition);

// When user and toilet positions are available:
Promise.all([toilettesP, position])
	.then(function(values){
		// set toiletFiltered(filter)
		var toilettes = values[0],
			position = values[1];

		console.log('verif ', toilettes);

		findClosest(toilettes, position);
	})
	.catch(function(err){console.error(err)})

//////////////////////////


function findClosest(list, position){

	list.forEach(function(toilette){
        // Calculate rough distance b/w user and toilet
        toilette.d = Math.hypot(toilette.lat - position.lat, toilette.lng - position.lng);

        // Add click event on toilet
	    toilette.marker.addEventListener('click', function(){
	    	map.removeLayer(drawables.closestGroup);
	    	drawables.singleGroup.clearLayers();

			itinerary(position, toilette)
				.then(function(result){
					var infos = addInfos(result, 1);

					infos.polyline.addTo(drawables.singleGroup);
					infos.marker.addTo(drawables.singleGroup);
					
					drawables.singleGroup.addTo(map);

				}).catch(function(err){console.error(err)})
		});
    });
    
	list.sort(function (a, b) {
		return (a.d - b.d);
	});

    var closestToilettes = list.slice(0, 3);
    
	var closestLats = closestToilettes.map(function(t){return t.lat;}),
		closestLngs = closestToilettes.map(function(t){return t.lng;});

	var itinerariesPs = closestToilettes.map(function(t){ return itinerary(position, t); });

	// Fits the map so all shortest routes are displayed
	var north = U.getMaxOfArray(closestLats),
		south = U.getMinOfArray(closestLats),
		east = U.getMaxOfArray(closestLngs),
		west = U.getMinOfArray(closestLngs);

	var southWest = L.latLng(south, west),
    	northEast = L.latLng(north, east);
    
    var bounds = L.latLngBounds(southWest, northEast);
    map.fitBounds(bounds);

    // When all itineraries are computed
    Promise.all(itinerariesPs).then(function(toilets){

		toilets.sort(function (a, b) {
			return (a.routes[0].legs[0].distance.value - b.routes[0].legs[0].distance.value);
		});

		// Calculate itineraries for 3 closest toilets
		toilets.forEach(function(toilet, i){

			console.log('toilet ', toilet);

			var infos = addInfos(toilet, i);
			infos.polyline.addTo(drawables.closestGroup);
			infos.marker.addTo(drawables.closestGroup);

        });

		// Draw infos on closest toilets
		drawables.closestGroup.addTo(map);

	}).catch(function(err){console.error(err)})
}





