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
};

var filterMap = {
	"urinoir-filter" : "urinoir",
	"sanitaire-filter": "sanitaire",
	"handi-filter": "handicap",
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
	    updateClosest(drawables.closestGroup);
	});

	updateClosest(marker);

	return {
		lat: latitude,
		lng: longitude
	};
}

function displayModes(){

	map.removeLayer(drawables.toiletGroup);

	modes.forEach(function(mode){
		switch (mode) {
			case 'urinoir':
				drawables.urinoirGroup.addTo(map);
			case 'sanitaire':
				drawables.sanitaireGroup.addTo(map);
			case 'handicap':
				drawables.handiGroup.addTo(map);
			default:
				drawables.toiletGroup.addTo(map);
		}
	});
}

function updateClosest(item, boundaries){
	if (boundaries){
		map.fitBounds(boundaries);
	}

	map.removeLayer(drawables.closestGroup);
	map.removeLayer(drawables.singleGroup);

	item.addTo(map);
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
					
					updateClosest(drawables.singleGroup);

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

function filterToilets(list, types){
	var filtered = [];

	list.forEach(function(toilette){
		if (types.indexOf(toilette.class) != -1){
			filtered.push(toilette);
		}
		if ((types.indexOf('handicap') != -1) && toilette.handicap){
			if (filtered.indexOf(toilette) === -1){ // check if toilette isn't already added
				filtered.push(toilette);
			}	
		}
	});

    return filtered;
}

function deactivateMode(dom){
	dom.className = 'filter inactive';

	var index = modes.indexOf(filterMap[dom.id]);
	if (index > -1){
		modes.splice(index, 1);

		if (modes.length === 0){
			activateAllModes(modes);
		}
	}
}

function activateMode(dom){
	dom.className = 'filter active';
	var id = dom.id;
	modes.push(filterMap[id]);
}

function activateAllModes(){
	modes = ['urinoir', 'sanitaire', 'handicap'];
}

function deactivateAllModes(){
	modes = [];
	filterButtons[0].className = 'filter inactive';
	filterButtons[1].className = 'filter inactive';
	filterButtons[2].className = 'filter inactive';
}


function addClicFilter(toilettes, position){
	// // for each doesn't seem to work with an array of DOM elements...
	// filterButtons.forEach(function(){
	// 	console.log('test');
	// });

	// For 'urinoir'
	filterButtons[0].addEventListener('click', function(){
		if (modes.length === 3){ // if all is selected (default), click selects rather than deselects
			deactivateAllModes();
			activateMode(this);
		}
		else {
			if (this.className === 'filter active'){
				deactivateMode(this);
			}
			else {
				activateMode(this);
			}
		}

		var selection = filterToilets(toilettes, modes);
		findClosest(selection, position);
	});

	// For 'sanitaire'
	filterButtons[1].addEventListener('click', function(){
		if (modes.length === 3){ // if all is selected (default), click selects rather than deselects
			deactivateAllModes();
			activateMode(this);
		}
		else {
			if (this.className === 'filter active'){
				deactivateMode(this);
			}
			else {
				activateMode(this);
			}
		}
		
		var selection = filterToilets(toilettes, modes);
		findClosest(selection, position);
	});

	// For 'handi'
	filterButtons[2].addEventListener('click', function(){
		if (modes.length === 3){ // if all is selected (default), click selects rather than deselects
			deactivateAllModes();
			activateMode(this);
		}
		else {
			if (this.className === 'filter active'){
				deactivateMode(this);
			}
			else {
				activateMode(this);
			}
		}

		var selection = filterToilets(toilettes, modes);
		findClosest(selection, position);
	});
}

function findClosest(list, position){

	drawables.singleGroup.clearLayers();
	drawables.closestGroup.clearLayers();

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
		updateClosest(drawables.closestGroup, bounds);

	}).catch(function(err){console.error(err)})
}



/// MAIN CODE

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

var modes = ['urinoir', 'sanitaire', 'handicap'];

// render points on map regardless of geolocation
toilettesP
	.then(function(toilettes){
	    toilettes.forEach(function(element){
			var groups = setMarker(element);

			groups.forEach(function(group){
				element.marker.addTo(group);
			});
			
		});
	    
	    displayModes();
	});


// var closestUrinoirs = undefined;
// var closestSanitaires = undefined;
// var closestHandis = undefined;

var position = geo(updatePosition);
var filterButtons = document.getElementsByClassName('filter');

// When user and toilet positions are available:
Promise.all([toilettesP, position])
	.then(function(values){
		var toilettes = values[0],
			position = values[1];

		addClicFilter(toilettes, position);

		addClicBehaviour(toilettes, position);

		findClosest(toilettes, position);
	})
	.catch(function(err){console.error(err)})

//////////////////////////









