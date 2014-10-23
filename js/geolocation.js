'use strict';

var L = require('leaflet');

// var output = document.getElementById("out");

// Get user location
if (!navigator.geolocation){
	output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
	return;
}

module.exports = function(f){

	return new Promise(function(resolve, reject){
		function success(position){
			resolve(f(position));
		}

		function error(){
			// do something
			// offline bheaviour (or the user rejected the localization)
			// display a message telling the user that the app couldn't calculate itineraries or something
			reject('error');
		}

		navigator.geolocation.watchPosition(success, error);
	});	
};
