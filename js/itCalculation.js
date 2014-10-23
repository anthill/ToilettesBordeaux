'use strict'

var directionsService = new google.maps.DirectionsService();

function serializeLatLng(ll) {
	return '{latitude: ' + ll.lat() + ', longitude: ' + ll.lng() + '}';
}

function calcRoute(startLocation, endLocation) {    
    var mode = google.maps.DirectionsTravelMode.WALKING;

    var request = {
        origin: startLocation,
        destination: endLocation,
        travelMode: mode,
    };

    return new Promise(function(resolve, reject){
		directionsService.route(request, function(response, status) {
	    	console.log('status ', status);

	    	if (status === google.maps.DirectionsStatus.OK) {
	    		console.log('response ', response);
				resolve(response.route[0]);
	      	}
	      	else {
	      		reject(status);
	      	}
	    });
    });
}

module.exports = function(start, end) {
	var startLocation = new google.maps.LatLng(start.lat,start.lng);
	var endLocation = new google.maps.LatLng(end.lat,end.lng);

	return calcRoute(startLocation, endLocation);
};