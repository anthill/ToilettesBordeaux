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
	user: undefined,
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
	    updateMap(drawables.closestGroup);
	});

	updateMap(marker);

	return {
		lat: latitude,
		lng: longitude
	};
}

function updateMap(items, boundaries){
	if (boundaries){
		map.fitBounds(boundaries);
	}
	
	items.addTo(map);
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

function addClicBehaviour(list, position){
	list.forEach(function(toilette){

        // Add click event on toilet
	    toilette.marker.addEventListener('click', function(){
	    	map.removeLayer(drawables.closestGroup);
	    	drawables.singleGroup.clearLayers();

			itinerary(position, toilette)
				.then(function(result){
					var infos = addInfos(result, 1);

					infos.polyline.addTo(drawables.singleGroup);
					infos.marker.addTo(drawables.singleGroup);
					
					updateMap(drawables.singleGroup);
					// drawables.singleGroup.addTo(map);

				}).catch(function(err){console.error(err)})
		});
    });
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

function findClosest(list, position){

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

	var itinerariesPs = closestToilettes.map(function(t){ return itinerary(position, t); });
    
    var bounds = calculateBounds(closestLats, closestLngs);

    // When all itineraries are computed
    Promise.all(itinerariesPs).then(function(toilets){

		toilets.sort(function (a, b) {
			return (a.routes[0].legs[0].distance.value - b.routes[0].legs[0].distance.value);
		});

		// Calculate itineraries for 3 closest toilets
		toilets.forEach(function(toilet, i){

			var infos = addInfos(toilet, i);
			infos.polyline.addTo(drawables.closestGroup);
			infos.marker.addTo(drawables.closestGroup);

        });

		// Draw infos on closest toilets
		updateMap(drawables.closestGroup, bounds);

	}).catch(function(err){console.error(err)})
}

function filterToilets(list, type){
	var filtered = [];

	// if (type === 'handi'){
	// 	list.forEach(function(toilette){
 //        	if (toilette.handicap){
	// 			filtered.push(toilette);
	// 		}
 //    	});
	// }
	// else {
	// 	list.forEach(function(toilette){
	// 		if (type.indexOf(toilette.class)){
	// 			filtered.push(toilette);
	// 		}
	// 	});
	// }

	list.forEach(function(toilette){
		if (type.indexOf(toilette.class) != -1){
			filtered.push(toilette);
		}
		if ((type.indexOf('handi') != -1) && toilette.handicap){
			if (filtered.indexOf(toilette) === -1){ // check if toilette isn't already added
				filtered.push(toilette);
			}	
		}
	});

    return filtered;
}


/// MAIN CODE


var filterButtons = document.getElementsByClassName('filter');

// for each doesn't seem to work with an array of DOM elements...
// need to handle the case where none is selected
filterButtons[0].addEventListener('click', function(){
	if (this.className === 'filter active'){
		this.className = 'filter inactive'
	}
	else {
		this.className = 'filter active'
	}
});

filterButtons[1].addEventListener('click', function(){
	if (this.className === 'filter active'){
		this.className = 'filter inactive'
	}
	else {
		this.className = 'filter active'
	}
});

filterButtons[2].addEventListener('click', function(){
	if (this.className === 'filter active'){
		this.className = 'filter inactive'
	}
	else {
		this.className = 'filter active'
	}
});

// filterButtons.forEach(function(button){
// 	console.log('test');
// 	button.addEventListener('click', function(){
// 		// filtersButtons.forEach(function(temp){
// 		// 	temp.style.className = 'filter';
// 		// });
// 		button.style.className = 'filter active';
// 	});
// });

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
	    
	    updateMap(drawables.toiletGroup);
	});


var closestUrinoirs = undefined;
var closestSanitaires = undefined;
var closestHandis = undefined;

////////////////////// FONCTION GENERALE
var position = geo(updatePosition);

// When user and toilet positions are available:
Promise.all([toilettesP, position])
	.then(function(values){
		// set toiletFiltered(filter)
		var toilettes = values[0],
			position = values[1];

		var test = filterToilets(toilettes, ['handi', 'urinoir', 'sanitaire']);
		console.log("filtered ", test);

		// console.log('verif ', test);

		addClicBehaviour(toilettes, position);

		findClosest(test, position);
	})
	.catch(function(err){console.error(err)})

//////////////////////////









