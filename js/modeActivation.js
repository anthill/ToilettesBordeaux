'use strict';

var displayModes = require('./mapFunctions.js')().displayModes;
var find3Closests = require('./findClosest.js').find3Closests;

var filterMap = {
	"urinoir-filter": "urinoir",
	"sanitaire-filter": "sanitaire",
	"handi-filter": "handicap"
};

var filterButtons = document.getElementsByClassName('filter');


module.exports = function(drawables){
	// function deactivate(dom, modes){
	// 	dom.className = 'filter inactive';

	// 	var index = modes.indexOf(filterMap[dom.id]);
	// 	if (index > -1){
	// 		modes.splice(index, 1);
	// 		displayModes(modes);

	// 		if (modes.length === 0){
	// 			activateAll(modes);
	// 		}
	// 	}
	// }

	function activate(dom, modes){
		dom.className = 'filter active';
		var id = dom.id;
		modes.push(filterMap[id]);
		displayModes(modes, drawables);

		return modes;
	}

	function activateAll(modes){
		modes = ['urinoir', 'sanitaire', 'handicap'];
		filterButtons[0].className = 'filter active';
		filterButtons[1].className = 'filter active';
		filterButtons[2].className = 'filter active';
		displayModes(modes, drawables);

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
		var filtered = [];

		list.forEach(function(toilette){
			if (types.indexOf(toilette.class) !== -1){
				filtered.push(toilette);
			}
			if ((types.indexOf('handicap') !== -1) && toilette.handicap){
				if (filtered.indexOf(toilette) === -1){ // check if toilette isn't already added
					filtered.push(toilette);
				}   
			}
		});

		return filtered;
	}


	var ret = function (toilettes, position, modes){
		// // for each doesn't seem to work with an array of DOM elements...
		// filterButtons.forEach(function(){
		//  console.log('test');
		// });

		// For 'urinoir'
		filterButtons[0].addEventListener('click', function(){
			if (modes.length === 3){ // if all is selected (default), click selects rather than deselects
				modes = deactivateAll(modes);
				modes = activate(this, modes);
			}
			else if (this.className === 'filter inactive'){
				modes = deactivateAll(modes);
				modes = activate(this, modes);
				// if (this.className === 'filter active'){
				//     modes = deactivate(this, modes);
				// }
				// else {
				//     modes = activate(this, modes);
				// }
			}
			else if (this.className === 'filter active'){
				modes = activateAll(modes);
			}


			var selection = filterToilets(toilettes, modes);
			find3Closests(selection, position);
		});

		// For 'sanitaire'
		filterButtons[1].addEventListener('click', function(){
			if (modes.length === 3){ // if all is selected (default), click selects rather than deselects
				modes = deactivateAll(modes);
				modes = activate(this, modes);
			}
			else if (this.className === 'filter inactive'){
				modes = deactivateAll(modes);
				modes = activate(this, modes);
				// if (this.className === 'filter active'){
				//     modes = deactivate(this, modes);
				// }
				// else {
				//     modes = activate(this, modes);
				// }
			}
			else if (this.className === 'filter active'){
				modes = activateAll(modes);
			}
			
			var selection = filterToilets(toilettes, modes);
			find3Closests(selection, position);
		});

		// For 'handi'
		filterButtons[2].addEventListener('click', function(){
			if (modes.length === 3){ // if all is selected (default), click selects rather than deselects
				modes = deactivateAll(modes);
				modes = activate(this, modes);
			}
			else if (this.className === 'filter inactive'){
				modes = deactivateAll(modes);
				modes = activate(this, modes);
				// if (this.className === 'filter active'){
				//     modes = deactivate(this, modes);
				// }
				// else {
				//     modes = activate(this, modes);
				// }
			}
			else if (this.className === 'filter active'){
				modes = activateAll(modes);
			}

			var selection = filterToilets(toilettes, modes);
			find3Closests(selection, position);
		});
	};

	return ret;

};
