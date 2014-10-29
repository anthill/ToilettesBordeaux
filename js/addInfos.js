'use strict'		

module.exports = function(toilets, index){
	console.log('Les plus proches: ', toilets);


	var result = toilets.result;
	var rank = '';
	var color = '#000000';

	if (index == 0){
		rank += 'first';
		color = '#008200';
	}
	
	// Get route points
	var destination = L.latLng(result.mc.destination.k, result.mc.destination.B);
	var route = result.routes[0];
	var path = route.overview_path;
	var routeLatLng = [];
	for (var j = 0; j < path.length; j++)
		routeLatLng[j] = {lat: path[j].k, lng: path[j].B};

	// Create and add infos on the route
	var minutes = Math.floor(route.legs[0].duration.value / 60);
	var secondes = route.legs[0].duration.value % 60;
	var time = minutes + "' "  + secondes + "\" ";
	var distance = route.legs[0].distance.value;

	var infos = L.divIcon({
        className: ['infos', rank].join(' '),
        iconSize: new L.Point(70, 70),
        iconAnchor: new L.Point(35, 108),
        html: time + '<div class="subInfos">' + distance + ' m </div>'
    });
	
    var marker = L.marker(destination, {icon: infos});

    // Draw route
	var polyline = L.polyline(routeLatLng, {
		className: ['route', rank].join(' '),
		color: color,
		smoothFactor: 3.0,
    	noClip: true,
    	opacity: 1
	});

	return {
		polyline: polyline,
		marker: marker
	};
}