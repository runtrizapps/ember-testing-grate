import { handleSuccess, handleFailure } from './assert-promise';

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

    var key, val, promiseList = [];

    for (key in data) {
      if (data.hasOwnProperty(key)) {
        val = data[key];

        if (typeof val === 'function') {
          val = val.call(object, object.get(key));

          if (val.then) {
            val = val.catch(handleFailure('Failed to apply attribute: ' + key));
            promiseList.push(val);
            continue;
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

export default applyData;
export { applyData };
