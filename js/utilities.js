'use strict';

function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

function filterToilets(list, types){
	return list.filter(function(toilette){
		return types.indexOf(toilette.class) !== -1 ||
			((types.indexOf('handicap') !== -1) && toilette.handicap);
	});
}

module.exports = {
	getMinOfArray: getMinOfArray,
	getMaxOfArray: getMaxOfArray,
	filterToilets: filterToilets
};
