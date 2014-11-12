'use strict';

var L = require('leaflet');
var U = require('./utilities.js');

var map = require('./initializeMap.js');


module.exports = function(){


	var drawables = {
		user: undefined,
		singleGroup: L.layerGroup(),
		closestGroup: L.layerGroup(),
		urinoirGroup: L.layerGroup(),
		sanitaireGroup: L.layerGroup(),
		handiGroup: L.layerGroup(),
		toiletGroup: L.layerGroup()
	};


	function displayItinerary(item, boundaries){
		if (boundaries){
			map.fitBounds(boundaries, {
				paddingTopLeft: [0, 110],
				paddingBottomRight: [0, 50]
			});
		}
		map.removeLayer(drawables.closestGroup);
		map.removeLayer(drawables.singleGroup);

		item.addTo(map);
	}

	function calculateBounds(lats, lngs){
		// Fits the map so all shortest routes are displayed
		var north = U.getMaxOfArray(lats),
			south = U.getMinOfArray(lats),
			east = U.getMaxOfArray(lngs),
			west = U.getMinOfArray(lngs);

		console.log("north ", north);
		var southWest = L.latLng(south, west),
			northEast = L.latLng(north, east);

		return L.latLngBounds(southWest, northEast);
	}

	function setMarker(toilet){
		// Add icons from FontAwesome
		var myHtml = '';
		var groups = [drawables.toiletGroup];

		if (toilet.class === 'sanitaire') {
			myHtml += '<i class="fa fa-female"></i><i class="fa fa-male"></i>\n';
			groups.push(drawables.sanitaireGroup);
		}
		else {
			myHtml += '<i class="fa fa-male urinoir"></i>\n';
			groups.push(drawables.urinoirGroup);
		}
		
		if (toilet.handicap === true){
			myHtml += '<div class="pins"><i class="fa fa-fw fa-wheelchair"></i></div>\n';
			groups.push(drawables.handiGroup);
		} 

		var icon = L.divIcon({
			className: "icon",
			iconSize: new L.Point(46, 46),
			iconAnchor: new L.Point(23, 23),
			html: myHtml
		});

		toilet.marker = L.marker([toilet.lat, toilet.lng], {icon: icon});
		return groups;
	}

	function displayModes(modes, drawables){

		map.removeLayer(drawables.toiletGroup);
		map.removeLayer(drawables.handiGroup);
		map.removeLayer(drawables.urinoirGroup);
		map.removeLayer(drawables.sanitaireGroup);

		modes.forEach(function(mode){
			switch (mode) {
				case 'urinoir':
					console.log('mode ', mode);
					drawables.urinoirGroup.addTo(map);
					break;
				case 'sanitaire':
					console.log('mode ', mode);
					drawables.sanitaireGroup.addTo(map);
					break;
				case 'handicap':
					console.log('mode ', mode);
					drawables.handiGroup.addTo(map);
					break;
				default:
					drawables.toiletGroup.addTo(map);
					break;
			}
		});
	}

	// Get user position
	function updatePosition(position){
		var latitude  = position.coords.latitude;
		var longitude = position.coords.longitude;

		var icon = L.divIcon({
				className: "user",
				iconSize: new L.Point(72, 72),
				iconAnchor: new L.Point(36, 36),
				html: '<span class="fa-stack fa-lg fa-3x"><i class="fa fa-circle fa-stack-1x"></i><i class="fa fa-bullseye fa-stack-1x"></i></span>'
			});

		var marker;

		if(marker)
			map.removeLayer(marker);

		marker = L.marker([latitude, longitude], {icon: icon});
		drawables.user = marker;

		// Add click event on user position
		marker.addEventListener('click', function(){
			drawables.singleGroup.clearLayers();
			displayItinerary(drawables.closestGroup);
		});

		marker.addTo(map);

		return {
			lat: latitude,
			lng: longitude
		};
	}

	return {
		drawables: drawables,
		displayItinerary: displayItinerary,
		calculateBounds: calculateBounds,
		setMarker: setMarker,
		displayModes: displayModes,
		updatePosition: updatePosition
	};

};
