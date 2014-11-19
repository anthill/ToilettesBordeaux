'use strict';

var L = require('leaflet');

var itinerary = require('./itCalculation.js');
var createInfos = require('./createInfos.js');
var render = require('./renderMap.js');


function set(toilet){
	// Add icons from FontAwesome
	var myHtml = '';

	if (toilet.class === 'sanitaire') {
		myHtml += '<i class="fa fa-female"></i><i class="fa fa-male"></i>\n';
	}
	else {
		myHtml += '<i class="fa fa-male urinoir"></i>\n';
	}
	
	if (toilet.handicap === true){
		myHtml += '<div class="pins"><i class="fa fa-fw fa-wheelchair"></i></div>\n';
	} 

	var icon = L.divIcon({
		className: "icon",
		iconSize: new L.Point(46, 46),
		iconAnchor: new L.Point(23, 23),
		html: myHtml
	});

	toilet.marker = L.marker([toilet.lat, toilet.lng], {icon: icon});
	
}

function activate(toilets, position){
	toilets.forEach(function(toilet){

		toilet.marker.addEventListener('click', function(){

            itinerary(position, toilet)
                .then(function(result){

                    render({
                        toilettes: toilets,
                        position: position,
                        infos : [ createInfos(result, 1) ]
                    });

                }).catch(function(err){console.error(err);});
		});

	});
}

module.exports = {
	set: set,
	activate: activate
};
