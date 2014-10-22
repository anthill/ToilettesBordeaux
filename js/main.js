'use strict';

var L = require('leaflet');
var geo = require('./geolocation.js');
var itinerary = require('./itCalculation.js');

var BORDEAUX_COORDS = [44.84, -0.57];
var map = L.map('map').setView(BORDEAUX_COORDS, 12);

var latitude;
var longitude;

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

function updatePosition(position){
 	latitude  = position.coords.latitude;
	longitude = position.coords.longitude;


	var icon = L.divIcon({
		// comment utiliser le coté ['user icon', element.class].join('') ???
		className: 'user icon',
		iconSize: L.Point(0, 0) // when iconSize is set, CSS is respected. Otherwise, it's overridden -_-#
	});

	if(marker)
		map.removeLayer(marker);

	marker = L.marker([latitude, longitude], {icon: icon});
	map.addLayer(marker);
}

geo(updatePosition);



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

        		//check option
        		// if (test_option){
        		// 	console.log(test_option);
        		// }

        		return {
	                long: parseFloat(t["x_long"]),
	                lat: parseFloat(t["y_lat"]),
	                nom: t["nom"],
	                typologie: t["typologie"],
	                class: typologieToCSSClass[t["typologie"]] + " " + typologieToCSSClass[test_option],
            	};
        	}
        })
    });
 

toilettesP.then(function(toilettes){
	toilettes.forEach(function(element){
		// Add markers asap with an approximate color
	    var icon = L.divIcon({
	        className: ['icon', element.class].join(' '),
	        iconSize: L.Point(0, 0) // when iconSize is set, CSS is respected. Otherwise, it's overridden -_-#
	    });
	    
	    var marker = L.marker([element.lat, element.long], {icon: icon});

	    
	    map.addLayer(marker);
    
		// display toilet type
		// marker.on('click', afficheType());
	})
}).catch(function(err){console.error(err)})

// Find closest toilet

// Get itinerary
var start = {
	lat: 44.83155637711,
	lng: -0.601448460338731
};
var end = {
	lat: 44.8332160196094,
	lng: -0.561733163630468
};

itinerary(start ,end).then(function(route){
	console.log(route);
	// Draw itinerary
}).catch(function(err){
	console.error(err);
});

