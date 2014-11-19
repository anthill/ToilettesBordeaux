'use strict';

var geo = require('./geolocation.js');
var getToilets = require('./getJSON.js');
var findClosests = require('./findClosests.js');
var toiletMarkers = require('./setMarker.js');
var activateFilters = require('./modeActivation.js')();
var render = require('./renderMap.js');

var typologieToCSSClass = {
	"Urinoir": "urinoir",
	"Sanitaire automatique": "sanitaire",
	"Sanitaire automatique avec urinoir": "sanitaire",
	"Chalet de nécessité": "sanitaire"
};



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
			toiletMarkers.set(element);
		});
    
        render({
            toilettes: toilettes,
            position: undefined,
            infos : undefined
        });
	});

var position = geo();

// When user and toilet positions are available:
Promise.all([toilettesP, position])
	.then(function(values){
		var toilettes = values[0],
			position = values[1];

		activateFilters(toilettes, position, modes);
		toiletMarkers.activate(toilettes, position);

		findClosests(toilettes, position);
		
	})
	.catch(function(err){console.error(err);});
