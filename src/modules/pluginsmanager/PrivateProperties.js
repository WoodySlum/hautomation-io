/* eslint-disable */
// This module is used to make some private properties under ES6
// https://curiosity-driven.org/private-properties-in-javascript
// https://esdiscuss.org/topic/es6-problem-with-private-name-objects-syntax
// https://leanpub.com/understandinges6/read

var privateState = new WeakMap();
// /**
//  * Create a private object
//  *
//  * @param  {Object} o An instance (eg this when called in constructor)
//  */
function createPrivateState(o) {
    privateState.set(o, {});
}
// /**
//  * Set a property as private and return private var
//  *
//  * @param  {Object} o An object
//  * @returns {Object}   An object
//  */
function oprivate(o) { // "private" is a reserved keyword
    return privateState.get(o);
}

module.exports = {createPrivateState:createPrivateState, oprivate:oprivate};
