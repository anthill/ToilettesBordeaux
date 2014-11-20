'use strict';

var findClosests = require('./findClosests.js');
var createInfos = require('./createInfos.js');
var render = require('./renderMap.js');
var geo = require('./geolocation.js');


var filterMap = {
	"urinoir-filter": "urinoir",
	"sanitaire-filter": "sanitaire",
	"handi-filter": "handicap"
};

var filterButtons = document.getElementsByClassName('filter');

function activate(dom, modes){
	dom.className = 'filter active';
	var id = dom.id;
	modes.push(filterMap[id]);
	// displayModes(modes, drawables);

	return modes;
}

function activateAll(modes){
	modes = ['urinoir', 'sanitaire', 'handicap'];
	filterButtons[0].className = 'filter active';
	filterButtons[1].className = 'filter active';
	filterButtons[2].className = 'filter active';
	// displayModes(modes, drawables);

	return modes;
}

function deactivateAll(modes){
	modes = [];
	filterButtons[0].className = 'filter inactive';
	filterButtons[1].className = 'filter inactive';
	filterButtons[2].className = 'filter inactive';

	return modes;
}

function filterToilets(list, types){
	return list.filter(function(toilette){
		return types.indexOf(toilette.class) !== -1 ||
			((types.indexOf('handicap') !== -1) && toilette.handicap);
	});
}
	
module.exports = function(toilettes, modes){

	function clickHandle(){
		if (modes.length === 3){ // if all is selected (default), click selects rather than deselects
			modes = deactivateAll(modes);
			modes = activate(this, modes);
		}
		else if (this.className === 'filter inactive'){
			modes = deactivateAll(modes);
			modes = activate(this, modes);
		}
		else if (this.className === 'filter active'){
			modes = activateAll(modes);
		}

		var selection = filterToilets(toilettes, modes);
        
        // filter regardless of being able to geolocate
        render({
            toilettes: selection,
            position: geo.lastPosition,
            infos: undefined
        });
        
        if(geo.lastPosition){
            findClosests(selection, geo.lastPosition).then(function(itineraries){

                var infos = itineraries.map(createInfos);

                render({
                    toilettes: selection,
                    position: geo.lastPosition,
                    infos: infos
                });

            });
        }
	}

	// For 'urinoir'
	filterButtons[0].addEventListener('click', clickHandle);

	// For 'sanitaire'
	filterButtons[1].addEventListener('click', clickHandle);

	// For 'handi'
	filterButtons[2].addEventListener('click', clickHandle);
};
