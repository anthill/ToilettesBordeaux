'use strict';

var itinerary = require('./itCalculation.js');
var addInfos = require('./addInfos.js');
var render = require('./renderMap.js');
var U = require('./utilities.js');


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

		// var filterButtons = document.getElementsByClassName('filter');
		// var modes = [];

		// if (filterButtons[0].className === 'filter active')
		// 	modes.push('urinoir');
		// if (filterButtons[1].className === 'filter active')
		// 	modes.push('sanitaire');
		// if (filterButtons[2].className === 'filter active')
		// 	modes.push('handicap');

		// console.log('Active modes ', modes);

		// var filteredList = U.filterToilets(list, modes);

		// console.log('Filtered list ', filteredList);

		itinerary(position, toilet)
			.then(function(result){
				var infos = [];
				infos.push(addInfos(result, 1));
				
				render({
					toilettes: undefined,
					position: position,
					singleInfos: infos,
					closestInfos: undefined
				});

			}).catch(function(err){console.error(err);});
		});

	});
}

module.exports = {
	set: set,
	activate: activate
};
