'use strict';

function formatGeoloc(position){
	var latitude  = position.coords.latitude;
	var longitude = position.coords.longitude;

	return {
		lat: latitude,
		lng: longitude
	};
}

var lastPosition;

var exp = {
    // ES5 getters break IE8. Should we give a shit?
    get lastPosition(){
        return lastPosition;
    },
    
    getCurrentPosition : function(){

        return new Promise(function(resolve, reject){
            function success(position){
                var pos = formatGeoloc(position);
                lastPosition = pos;
                resolve(pos);
            }

            function error(){
                // do something
                // offline bheaviour (or the user rejected the localization)
                // display a message telling the user that the app couldn't calculate itineraries or something
                reject('error');
            }

            navigator.geolocation.getCurrentPosition(success, error);
        });	
    }
};

module.exports = exp;
