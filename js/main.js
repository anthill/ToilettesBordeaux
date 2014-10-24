'use strict';

var L = require('leaflet');
var geo = require('./geolocation.js');
var itinerary = require('./itCalculation.js');

var BORDEAUX_COORDS = [44.84, -0.57];
var map = L.map('map').setView(BORDEAUX_COORDS, 12);

L.tileLayer('http://api.tiles.mapbox.com/v3/ourson.k0i572pc/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var typologieToCSSClass = {
	"Urinoir": "urinoir",
	"Sanitaire automatique": "sanitaire",
	"Sanitaire automatique avec urinoir": "sanitaire urinoir",
	"Chalet de nécessité": "chalet",
	"Handicapé": "handicap"
};

var marker;

// Get user position
function updatePosition(position){
 	var latitude  = position.coords.latitude;
	var longitude = position.coords.longitude;


	var icon = L.divIcon({
		// comment utiliser le coté ['user icon', element.class].join('') ???
		className: 'user icon',
		iconSize: L.Point(0, 0) // when iconSize is set, CSS is respected. Otherwise, it's overridden -_-#
	});

	if(marker)
		map.removeLayer(marker);

	marker = L.marker([latitude, longitude], {icon: icon});
	map.addLayer(marker);

	return {
		lat: latitude,
		lng: longitude
	}
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

        		//check option
        		// if (test_option){
        		// 	console.log(test_option);
        		// }

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
 

toilettesP.then(function(toilettes){
    toilettes.forEach(function(element){
		
		// Add markers asap with an approximate color
	    var icon = L.divIcon({
	        className: ['icon', element.class].join(' '),
	        iconSize: L.Point(0, 0) // when iconSize is set, CSS is respected. Otherwise, it's overridden -_-#
	    });
	    
	    var marker = L.marker([element.lat, element.lng], {icon: icon});
	    
	    map.addLayer(marker);
	});
})

Promise.all([toilettesP, position]).then(function(values){

	var toilettes = values[0],
		position = values[1];

	var closest;
	var route;

    toilettes.forEach(function(toilette){
        toilette.distance = Math.hypot(toilette.lat - position.lat, toilette.lng - position.lng);
    });
    
	toilettes.sort(function (a, b) {
		return (a.distance - b.distance);
	});

	for (var i = 0; i < 3; i++){
		console.log(i);
		itinerary(position, toilettes[i]).then(function(result){
			// draw route
			route = result.overview_path;
			var routeLatLng = [];
			for (var j = 0; j < route.length; j++){
				var lat = route[j].k,
					lng = route[j].B;

				routeLatLng[j] = {lat: lat, lng: lng};
			}

			var polyline = L.polyline(routeLatLng, {color: 'red'}).addTo(map);
		}).catch(function(err){
			console.error(err);
		});
	}
    
		// display toilet type
		// marker.on('click', afficheType());
	// })

	


}).catch(function(err){console.error(err)})
