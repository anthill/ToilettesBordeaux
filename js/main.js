'use strict';

var geo = require('./geolocation.js');
var getToilets = require('./getJSON.js');
var findClosests = require('./findClosests.js');
var activateFilters = require('./modeActivation.js')();
var L = require('leaflet');


var typologieToCSSClass = {
	"Urinoir": "urinoir",
	"Sanitaire automatique": "sanitaire",
	"Sanitaire automatique avec urinoir": "sanitaire",
	"Chalet de nécessité": "sanitaire"
};


// Get user position
function updatePosition(position){
	var latitude  = position.coords.latitude;
	var longitude = position.coords.longitude;

	return {
		lat: latitude,
		lng: longitude
	};
}

function setMarker(toilet){
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

	toilet.marker = L.marker([toilet.lat, toilet.lng], {icon: icon});
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
			setMarker(element);
		});
	});

var position = geo(updatePosition);

// When user and toilet positions are available:
Promise.all([toilettesP, position])
	.then(function(values){
		var toilettes = values[0],
			position = values[1];

		activateFilters(toilettes, position, modes);

		findClosests(toilettes, position);
		
	})
	.catch(function(err){console.error(err);});





