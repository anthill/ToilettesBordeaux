'use strict';

function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

module.exports = {
	getMinOfArray: getMinOfArray,
	getMaxOfArray: getMaxOfArray
};
