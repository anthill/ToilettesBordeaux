'use strict';

var L = require('leaflet');
var geo = require('./geolocation.js');
var itinerary = require('./itCalculation.js');

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
	"Sanitaire automatique avec urinoir": "sanitaire urinoir",
	"Chalet de nécessité": "chalet",
	"Handicapé": "handicap"
}

var marker;

// Get user position
function updatePosition(position){
 	var latitude  = position.coords.latitude;
	var longitude = position.coords.longitude;


	var icon = L.divIcon({
		className: 'user icon',
		iconSize: L.Point(0, 0) // when iconSize is set, CSS is respected. Otherwise, it's overridden -_-#
	});

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

function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

var position = geo(updatePosition);
	// .then(function(position){
	// 	console.log("Position ", position);
	// 	resolve(position);
	// });


// Get toilet data
function getContents(url){
    return new Promise(function(resolve, reject){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.addEventListener('load', function(){
            if(xhr.status < 400)
                resolve(JSON.parse(xhr.responseText));
            else
                reject('Could not get content from '+url);
        });
        xhr.send();
    });
}

var toilettesP = getContents('data/toilettes.json')
    .then(function(data){
        console.log('raw', data);
        
        return data["d"].map(function(t){
        	var test = typologieToCSSClass[t["typologie"]];
        	var test_option = t["options"];
        	if (!test)
        		console.error(t);
        	else {
        		return {
	                lng: parseFloat(t["x_long"]),
	                lat: parseFloat(t["y_lat"]),
	                nom: t["nom"],
	                typologie: t["typologie"],
	                class: typologieToCSSClass[t["typologie"]] + " " + typologieToCSSClass[test_option],
            	};
        	}
        })
    });
 

Promise.all([toilettesP, position]).then(function(values){

	var toilettes = values[0],
		position = values[1];

	var closest;
	var distance = 100000;
	var route;

	toilettes.forEach(function(element){
		element.d = Math.sqrt(Math.pow(element.lat - position.lat, 2) + Math.pow(element.lng - position.lng, 2));
		// Add markers asap with an approximate color
	    var icon = L.divIcon({
	        className: ['icon', element.class].join(' '),
	        iconSize: L.Point(0, 0) // when iconSize is set, CSS is respected. Otherwise, it's overridden -_-#
	    });
	    
	    var marker = L.marker([element.lat, element.lng], {icon: icon});
	    
	    map.addLayer(marker);
	})

	toilettes.sort(function (a, b) {
		return (a.d - b.d);
	})

	var tempLats = [],
		tempLngs = [];

	for (var i = 0; i < 3; i++){
		tempLats.push(toilettes[i].lat);
		tempLngs.push(toilettes[i].lng);

		itinerary(position, toilettes[i]).then(function(result){
			// draw route
			route = result.overview_path;
			var routeLatLng = [];
			for (var j = 0; j < route.length; j++){
				var lat = route[j].k,
					lng = route[j].B;

				routeLatLng[j] = {lat: lat, lng: lng};

				// use result.bounds.Ea (center) result.bounds.va (span)
				// use result.legs[0].duration ...distance
			}

			// create and add infos on the route
			var infos = L.divIcon({
		        className: 'infos',
		        iconSize: L.Point(0, 0),
		        html: result.legs[0].distance.text + ' - ' + result.legs[0].duration.text // when iconSize is set, CSS is respected. Otherwise, it's overridden -_-#
		    });
		    
		    var center = {};
		    center.lat = (result.bounds.Ea.j + result.bounds.Ea.k) / 2;
		    center.lng = (result.bounds.va.j + result.bounds.va.k) / 2;

		    var marker = L.marker([center.lat, center.lng], {icon: infos});
		    
		    map.addLayer(marker);

		    // draw route
			var polyline = L.polyline(routeLatLng, {color: 'red'}).addTo(map);

		}).catch(function(err){
			console.error(err);
		});
	}

	var north = getMaxOfArray(tempLats),
		south = getMinOfArray(tempLats),
		east = getMaxOfArray(tempLngs),
		west = getMinOfArray(tempLngs);

	var southWest = L.latLng(south, west),
    	northEast = L.latLng(north, east);
    
    var bounds = L.latLngBounds(southWest, northEast);
    map.fitBounds(bounds);

    
		// display toilet type
		// marker.on('click', afficheType());
	// })

	


}).catch(function(err){console.error(err)})
