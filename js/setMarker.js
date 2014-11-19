'use strict';

var itinerary = require('./itCalculation.js');
var addInfos = require('./addInfos.js');
var render = require('./renderMap.js');
var L = require('leaflet');


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
                        toilettes: undefined,
                        position: position,
                        infos : [ addInfos(result, 1) ]
                    });

                }).catch(function(err){console.error(err);});
		});

	});
}

module.exports = {
	set: set,
	activate: activate
};
