define(
  ["./test-allows","./test-forbids","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var testList = __dependency1__.testList;
    var testCreate = __dependency1__.testCreate;
    var testGet = __dependency1__.testGet;
    var testUpdate = __dependency1__.testUpdate;
    var testDelete = __dependency1__.testDelete;
    var forbidList = __dependency2__.forbidList;
    var forbidCreate = __dependency2__.forbidCreate;
    var forbidGet = __dependency2__.forbidGet;
    var forbidUpdate = __dependency2__.forbidUpdate;
    var forbidDelete = __dependency2__.forbidDelete;

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

        function invokeAfter(result) {
          if (typeof configEntry.then === 'function') {
            configEntry.then.call(this, result);
          }
        }
      }

      processOption.call(this, 'list',   config.list,   testList,   forbidList);
      processOption.call(this, 'create', config.create, testCreate, forbidCreate, ['data']);
      processOption.call(this, 'read',   config.read,   testGet,    forbidGet,    ['source']);
      processOption.call(this, 'update', config.update, testUpdate, forbidUpdate, ['source', 'data']);
      processOption.call(this, 'delete', config.delete, testDelete, forbidDelete, ['source']);

    }

    __exports__.testCrud = testCrud;
  });