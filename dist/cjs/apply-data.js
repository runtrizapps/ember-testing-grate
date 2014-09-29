"use strict";
var handleSuccess = require("./assert-promise").handleSuccess;
var handleFailure = require("./assert-promise").handleFailure;

function applyData(object, data) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    if (typeof data === 'function') {
      var newObject = data.call(object, object);

      if (!newObject.then) {
        return resolve(newObject);
      } else {
        return newObject
          .catch(handleFailure('Failed to assemble data for model'))
          .then(resolve);
      }
    }

    var key, val, related, promiseList = [];

    for (key in data) {
      if (data.hasOwnProperty(key)) {
        val = data[key];

        if (typeof val === 'function') {
          val = val.call(object, object.get(key));

          if (val && val.then) {
            val = val.catch(handleFailure('Failed to apply attribute: ' + key));
            promiseList.push(val);
            continue;
          }
        } else {
          related = (object.constructor || {}).typeForRelationship && object.constructor.typeForRelationship(key);
          if (related && val.id && (val.fake || val.local)) {
            val = object.store.createRecord(related.typeKey, {id: val.id});
          }
        }

        if (typeof val !== 'undefined') {
          object.set(key, val);
        }
      }
    }
    Ember.RSVP.Promise.all(promiseList).then(function() {
      resolve(object);
    });
  });
}

exports["default"] = applyData;
exports.applyData = applyData;