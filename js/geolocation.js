'use strict';

var L = require('leaflet');

// var output = document.getElementById("out");

// Get user location
if (!navigator.geolocation){
	output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
	return;
}

module.exports = function(f){

	function success(position){
		f(position);
	}

	function error(){
		// do something
		// offline bheaviour (or the user rejected the localization)
		// display a message telling the user that the app couldn't calculate itineraries or something
	}

	navigator.geolocation.watchPosition(success, error);

}
