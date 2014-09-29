import { testList, testCreate, testGet, testUpdate, testDelete } from './test-allows';
import { forbidList, forbidCreate, forbidGet, forbidUpdate, forbidDelete } from './test-forbids';

function testCrud(test, name, config) {

  function processOption(operationName, configEntry, allowTest, rejectTest, configKeys) {
    if (typeof configEntry !== 'undefined') {
      if (Array.isArray(configEntry)) {
        for (var n = 0, m = configEntry.length; n < m; n++) {
          processOption.call(this, operationName, configEntry[n], allowTest, rejectTest, configKeys);
        }
        return;
      }

      var paramArray = [];
      if (configKeys) {
        for (var i = 0, l = configKeys.length; i < l; i++) {
          paramArray.push(configEntry[configKeys[i]]);
        }
      }
      if (configEntry.message) {
        paramArray.push(configEntry.message);
      }
      paramArray.unshift(name);

      if (configEntry !== false && configEntry.forbid !== true && configEntry.allow !== false) {
        test(operationName.capitalize() + " tests", function() {
          this._grateConfig = config; // todo - make this less sucky (1 of 2, see store-ops)
          Ember.run(this, function() {
            allowTest.apply(this, paramArray)
              .then(invokeAfter);
          });
        });
      } else {
        if (configEntry.statusCode) {
          paramArray.push(configEntry.statusCode);
        }
        test(operationName.capitalize() + " forbidden", function() {
          Ember.run(this, function() {
            rejectTest.apply(this, paramArray)
              .then(invokeAfter);
          });
        });
      }
    }

    function invokeAfter(resultsArray) {
      var promises = [],
          promise,
          payload,
          result;

      if (!Array.isArray(resultsArray)) {
        result = resultsArray;
        if (result.jqXHR) {
          payload = result.jqXHR.responseText;

          if (payload) try {
            payload = JSON.parse(payload)
          } catch (e) {
            payload = result.jqXHR.responseText;
          }
        }
      } else {
        result = resultsArray.get('firstObject');
        payload = resultsArray.objectAt(1);
      }

      if (typeof configEntry.then === 'function') {
        promise = configEntry.then.call(this, result);
        if (promise && promise.then) promises.push(promise);
      }

      if (typeof configEntry.payload === 'function') {
        promise = configEntry.payload.call(this, payload);
        if (promise && promise.then) promises.push(promise);
      }

      return Ember.RSVP.all(promises);
    }
  }

  processOption.call(this, 'list',   config.list,   testList,   forbidList);
  processOption.call(this, 'create', config.create, testCreate, forbidCreate, ['data']);
  processOption.call(this, 'read',   config.read,   testGet,    forbidGet,    ['source']);
  processOption.call(this, 'update', config.update, testUpdate, forbidUpdate, ['source', 'data']);
  processOption.call(this, 'delete', config.delete, testDelete, forbidDelete, ['source']);

}

export { testCrud };
