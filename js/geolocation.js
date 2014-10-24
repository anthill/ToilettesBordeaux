'use strict';

var L = require('leaflet');

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

		navigator.geolocation.getCurrentPosition(success, error);
	});	
};
