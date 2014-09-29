define("ember-testing-grate/apply-data",
  ["./assert-promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var handleSuccess = __dependency1__.handleSuccess;
    var handleFailure = __dependency1__.handleFailure;

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

    __exports__["default"] = applyData;
    __exports__.applyData = applyData;
  });
define("ember-testing-grate/assert-promise",
  ["exports"],
  function(__exports__) {
    "use strict";
    function handleSuccess(message) {
      return function(arg) {
        ok(true, message || "Promise resolved successfully");
        return arg;
      };
    }
    function handleFailure(message) {
      return function(arg) {
        var errorPrintout = '';
        if (arg.message) errorPrintout += "\nMessage: " + arg.message + "\n";

        if (arg.jqXHR) {
          errorPrintout += "\nStatus: " + arg.jqXHR.status + " " + arg.jqXHR.statusText + "\n" +
                           "Response: " + arg.jqXHR.responseText.substr(0, 450);
        } else if (arg.status) {
          errorPrintout += "\nStatus: " + arg.status;
        }
        ok(false, (message || "Promise was rejected") + errorPrintout);
        return arg;
      };
    }

    __exports__.handleSuccess = handleSuccess;
    __exports__.handleFailure = handleFailure;
  });
define("ember-testing-grate/crudder",
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

    __exports__.testCrud = testCrud;
  });
define("ember-testing-grate",
  ["ember","./crudder","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"] || __dependency1__;
    var testCrud = __dependency2__.testCrud;

    Ember.testing = true;

    function globalize() {
      window.testCrud = testCrud;
    }

    __exports__.testCrud = testCrud;
    __exports__.globalize = globalize;
  });
define("ember-testing-grate/store-ops",
  ["./apply-data","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var applyData = __dependency1__.applyData;

    function getStore(App, name) {
      return App.__container__.lookup('store:' + (name || 'main'));
    }

    function getCreateData() {
      var config = this._grateConfig,
          createData = config && config.create, // todo - make this less sucky (2 of 2, see crudder)
          data;

      function processCreateOption(opt) {
        if (opt && opt.allow !== false && opt.forbid !== true) {
          data = opt.data;
        }
      }

      if (Array.isArray(createData)) {
        createData.find(function(opt) {
          processCreateOption(opt);
          return !!data;
        });
      } else {
        processCreateOption(createData);
      }

      if (!data) throw new Error("Invalid source: `{source: 'create'}` was specified, but no `{allow: true}` create tests exist");
      return data;
    }

    function getList(name) {
      return getStore(this.App).find(name);
    }
    function getRandomFromList(name) {
      return getList.call(this, name)
        .then(function(list) {
          var length = list.get('length'),
              rand = Math.floor(Math.random() * length),
              item = list.objectAt(rand);

          if (length === 0) {
            throw new Error("'listRandom' source specified, but list was empty!");
          }
          return item.reload();
        });
    }
    function createItem(name, data) {
      var newObject = getStore(this.App).createRecord(name);

      return applyData.call(this, newObject, data)
        .then(function(object) {
          return object.save();
        });
    }
    function fetchItem(name, source) {
      var fetchFn, store, item;

      if (source === 'listRandom') {
        fetchFn = getRandomFromList.bind(this, name);
      } else if (source === 'listFilter') {
        // TODO - handle listFilter
      } else if (source === 'create') {
        fetchFn = createItem.bind(this, name, getCreateData.call(this));
      } else if (typeof source === 'number' || typeof source === 'string') {
        store = getStore(this.App);
        fetchFn = store.find.bind(store, name, source);
      } else if (typeof source === 'function') {
        fetchFn = source.bind({store: getStore(this.App)});
      } else if (source.fake || source.local) {
        Ember.assert("For local (fake) models, you must provide an id.", source.id);
        store = getStore(this.App);
        fetchFn = store.createRecord.bind(store, name, {id: source.id});
      } else {
        Ember.assert("Improper source specified");
        return;
      }

      item = fetchFn();
      if (!item.then) {
        return new Ember.RSVP.Promise(function(resolve) {
          resolve(item);
        });
      }
      return item;
    }

    function updateItem(item, data) {
      if (item.get('currentState.stateName').match(/created/)) {
        item.transitionTo('updated.uncommitted');
      }
      return applyData.call(this, item, data || {})
        .then(function(object) {
          return object.save();
        });
    }

    __exports__.getList = getList;
    __exports__.createItem = createItem;
    __exports__.fetchItem = fetchItem;
    __exports__.updateItem = updateItem;
    __exports__.getStore = getStore;
  });
define("ember-testing-grate/test-allows",
  ["./test-generators","./store-ops","./assert-promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var createAllowedTest = __dependency1__.createAllowedTest;
    var getList = __dependency2__.getList;
    var createItem = __dependency2__.createItem;
    var fetchItem = __dependency2__.fetchItem;
    var updateItem = __dependency2__.updateItem;
    var getStore = __dependency2__.getStore;
    var handleFailure = __dependency3__.handleFailure;

    function capturePayload(store, item, resultArray) {
      var serializer = store.serializerFor(item);
      serializer.reopen({
        extract: function(store, type, payload) {
          resultArray.clear();
          resultArray.unshift(payload);
          return this._super.apply(this, arguments);
        }
      });
    }

    function returnResults(array) {
      return function(result) {
        array.unshift(result);
        return array;
      };
    }

    function testUpdate(name, source, data, message) {
      var results = [];
      return createAllowedTest(
        fetchItem.call(this, name, source)
          .then(function(item) {
            capturePayload(item.store, item, results);
            return updateItem(item, data);
          }, handleFailure("Failed to obtain model for updating"))

          .then(returnResults(results)),
        name + " is updatable",
        name + " failed to be updated",
        message
      );
    }

    function testDelete(name, source, message) {
      var results = [];
      return createAllowedTest(
        fetchItem.call(this, name, source)
          .then(function(item) {
            if (item.get('currentState.stateName').match(/created/)) {
              item.transitionTo('saved');
            }
            capturePayload(item.store, item, results);
            return item.destroyRecord();
          }, handleFailure("Failed to obtain model for deleting"))

          .then(returnResults(results)),
        name + " is deletable",
        name + " failed to be deleted",
        message
      );
    }

    function testCreate(name, data, message) {
      var results = [];
      capturePayload(getStore(this.App), name, results);
      return createAllowedTest(
        createItem.call(this, name, data)
          .then(returnResults(results)),
        name + " is creatable",
        name + " failed to be created",
        message
      );
    }

    function testList(name, message) {
      var results = [];
      capturePayload(getStore(this.App), name, results);
      return createAllowedTest(
        getList.call(this, name)
          .then(returnResults(results)),
        name + " is listable",
        name + " failed to be listed",
        message
      );
    }

    function testGet(name, source, message) {
      var results = [];
      capturePayload(getStore(this.App), name, results);
      return createAllowedTest(
        fetchItem.call(this, name, source)
          .then(returnResults(results)),
        name + " is readable",
        name + " failed to be fetched",
        message
      );
    }

    __exports__.testList = testList;
    __exports__.testCreate = testCreate;
    __exports__.testGet = testGet;
    __exports__.testUpdate = testUpdate;
    __exports__.testDelete = testDelete;
  });
define("ember-testing-grate/test-forbids",
  ["./test-generators","./store-ops","./assert-promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var createForbidTest = __dependency1__.createForbidTest;
    var getList = __dependency2__.getList;
    var createItem = __dependency2__.createItem;
    var fetchItem = __dependency2__.fetchItem;
    var updateItem = __dependency2__.updateItem;
    var handleFailure = __dependency3__.handleFailure;

    function forbidUpdate(name, source, data, message, statusCode) {
      return createForbidTest(
        fetchItem.call(this, name, source)
          .then(function(item) {
            return updateItem(item, data);
          }, handleFailure("Failed to obtain model for updating")),
        name + " cannot be updated",
        name + " should NOT be updatable",
        message,
        statusCode
      );
    }

    function forbidDelete(name, source, message, statusCode) {
      return createForbidTest(
        fetchItem.call(this, name, source)
          .then(function(item) {
            if (item.get('currentState.stateName').match(/created/)) {
              item.transitionTo('saved');
            }
            return item.destroyRecord();
          }, handleFailure("Failed to obtain model for deleting")),
        name + " cannot be deleted",
        name + " should NOT be deletable",
        message,
        statusCode
      );
    }

    function forbidCreate(name, data, message, statusCode) {
      return createForbidTest(
        createItem.call(this, name, data),
        name + " cannot be created",
        name + " should NOT be creatable",
        message,
        statusCode
      );
    }

    function forbidList(name, message, statusCode) {
      return createForbidTest(
        getList.call(this, name),
        name + " is not listable",
        name + " should NOT be listable",
        message,
        statusCode
      );
    }

    function forbidGet(name, source, message, statusCode) {
      return createForbidTest(
        fetchItem.call(this, name, source),
        name + " is not readable",
        name + " should NOT be readable",
        message,
        statusCode
      );
    }

    __exports__.forbidList = forbidList;
    __exports__.forbidCreate = forbidCreate;
    __exports__.forbidGet = forbidGet;
    __exports__.forbidUpdate = forbidUpdate;
    __exports__.forbidDelete = forbidDelete;
  });
define("ember-testing-grate/test-generators",
  ["./assert-promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var handleSuccess = __dependency1__.handleSuccess;
    var handleFailure = __dependency1__.handleFailure;


    function createAllowedTest(promise, successMessage, failureMessage, extraMessage) {
      async();
      extraMessage = extraMessage ? ' - ' + extraMessage : '';
      return promise
        .then(handleSuccess(successMessage + extraMessage), handleFailure(failureMessage + extraMessage))
        .finally(asyncDone);
    }

    function createForbidTest(promise, successMessage, failureMessage, extraMessage, statusCode) {
      if (extraMessage && !statusCode) {
        if (typeof extraMessage === 'number' || !isNaN(parseInt(extraMessage, 10))) {
          statusCode = extraMessage;
          extraMessage = null;
        }
      }
      async();
      extraMessage = extraMessage ? ' - ' + extraMessage : '';
      return promise
        .then(handleFailure(failureMessage + extraMessage))
        .catch(function(error) {
          if (statusCode) {
            equal(error.status || error.jqXHR && error.jqXHR.status, statusCode, "returns expected HTTP " + statusCode + " response");
          }
          return handleSuccess(successMessage + extraMessage)(error);
        })
        .finally(asyncDone);
    }

    function async() {
      QUnit.stop();
    }
    function asyncDone(arg) {
      QUnit.start();
      return arg;
    }

    __exports__.createAllowedTest = createAllowedTest;
    __exports__.createForbidTest = createForbidTest;
  });