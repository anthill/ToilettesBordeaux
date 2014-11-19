'use strict';

function formatGeoloc(position){
	var latitude  = position.coords.latitude;
	var longitude = position.coords.longitude;

	return {
		lat: latitude,
		lng: longitude
	};
}

module.exports = function(){

	return new Promise(function(resolve, reject){
		function success(position){
			resolve(formatGeoloc(position));
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
