'use strict';

var geo = require('./geolocation.js');
var getToilets = require('./getJSON.js');
var activateFilters = require('./modeActivation.js')();
var map = require('./mapFunctions.js')();
var activateToiletSelection = require('./findClosest.js').activateToiletSelection;
var find3Closests = require('./findClosest.js').find3Closests;


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
            var groups = map.setMarker(element);

            groups.forEach(function(group){
                element.marker.addTo(group);
            });
            
        });
        
        map.displayModes(modes);
    });


var position = geo(map.updatePosition);


// When user and toilet positions are available:
Promise.all([toilettesP, position])
    .then(function(values){
        var toilettes = values[0],
            position = values[1];

        activateFilters(toilettes, position, modes);

        activateToiletSelection(toilettes, position);

        find3Closests(toilettes, position);
    })
    .catch(function(err){console.error(err);});

//////////////////////////








