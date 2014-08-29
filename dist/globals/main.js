!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.emgrate=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
var handleSuccess = _dereq_("./assert-promise").handleSuccess;
var handleFailure = _dereq_("./assert-promise").handleFailure;

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

exports["default"] = applyData;
exports.applyData = applyData;
},{"./assert-promise":2}],2:[function(_dereq_,module,exports){
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

exports.handleSuccess = handleSuccess;
exports.handleFailure = handleFailure;
},{}],3:[function(_dereq_,module,exports){
"use strict";
var testList = _dereq_("./test-allows").testList;
var testCreate = _dereq_("./test-allows").testCreate;
var testGet = _dereq_("./test-allows").testGet;
var testUpdate = _dereq_("./test-allows").testUpdate;
var testDelete = _dereq_("./test-allows").testDelete;
var forbidList = _dereq_("./test-forbids").forbidList;
var forbidCreate = _dereq_("./test-forbids").forbidCreate;
var forbidGet = _dereq_("./test-forbids").forbidGet;
var forbidUpdate = _dereq_("./test-forbids").forbidUpdate;
var forbidDelete = _dereq_("./test-forbids").forbidDelete;

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

exports.testCrud = testCrud;
},{"./test-allows":6,"./test-forbids":7}],4:[function(_dereq_,module,exports){
"use strict";
var Ember = window.Ember["default"] || window.Ember;
var testCrud = _dereq_("./crudder").testCrud;

Ember.testing = true;

function globalize() {
  window.testCrud = testCrud;
}

exports.testCrud = testCrud;
exports.globalize = globalize;
},{"./crudder":3}],5:[function(_dereq_,module,exports){
"use strict";
var applyData = _dereq_("./apply-data").applyData;

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
  var fetchFn;

  if (source === 'listRandom') {
    fetchFn = getRandomFromList.bind(this, name);
  } else if (source === 'listFilter') {
    // TODO - handle listFilter
  } else if (source === 'create') {
    fetchFn = createItem.bind(this, name, getCreateData.call(this));
  } else if (typeof source === 'number' || typeof source === 'string') {
    var store = getStore(this.App);
    fetchFn = store.find.bind(store, name, source);
  } else if (typeof source === 'function') {
    fetchFn = source.bind({store: getStore(this.App)});
  } else {
    Ember.assert("Improper source specified");
    return;
  }

  return fetchFn(); // TODO - promise wrap
}

function updateItem(item, data) {
  return applyData.call(this, item, data)
    .then(function(object) {
      return object.save();
    });
}

exports.getList = getList;
exports.createItem = createItem;
exports.fetchItem = fetchItem;
exports.updateItem = updateItem;
},{"./apply-data":1}],6:[function(_dereq_,module,exports){
"use strict";
var createAllowedTest = _dereq_("./test-generators").createAllowedTest;
var getList = _dereq_("./store-ops").getList;
var createItem = _dereq_("./store-ops").createItem;
var fetchItem = _dereq_("./store-ops").fetchItem;
var updateItem = _dereq_("./store-ops").updateItem;
var handleFailure = _dereq_("./assert-promise").handleFailure;

function testUpdate(name, source, data, message) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return updateItem(item, data);
      }, handleFailure("Failed to obtain model for updating")),
    name + " is updatable",
    name + " failed to be updated",
    message
  );
}

function testDelete(name, source, message) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return item.destroyRecord();
      }, handleFailure("Failed to obtain model for deleting")),
    name + " is deletable",
    name + " failed to be deleted",
    message
  );
}

function testCreate(name, data, message) {
  return createAllowedTest(
    createItem.call(this, name, data),
    name + " is creatable",
    name + " failed to be created",
    message
  );
}

function testList(name, message) {
  return createAllowedTest(
    getList.call(this, name),
    name + " is listable",
    name + " failed to be listed",
    message
  );
}

function testGet(name, source, message) {
  return createAllowedTest(
    fetchItem.call(this, name, source),
    name + " is readable",
    name + " failed to be fetched",
    message
  );
}

exports.testList = testList;
exports.testCreate = testCreate;
exports.testGet = testGet;
exports.testUpdate = testUpdate;
exports.testDelete = testDelete;
},{"./assert-promise":2,"./store-ops":5,"./test-generators":8}],7:[function(_dereq_,module,exports){
"use strict";
var createForbidTest = _dereq_("./test-generators").createForbidTest;
var getList = _dereq_("./store-ops").getList;
var createItem = _dereq_("./store-ops").createItem;
var fetchItem = _dereq_("./store-ops").fetchItem;
var updateItem = _dereq_("./store-ops").updateItem;
var handleFailure = _dereq_("./assert-promise").handleFailure;

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

exports.forbidList = forbidList;
exports.forbidCreate = forbidCreate;
exports.forbidGet = forbidGet;
exports.forbidUpdate = forbidUpdate;
exports.forbidDelete = forbidDelete;
},{"./assert-promise":2,"./store-ops":5,"./test-generators":8}],8:[function(_dereq_,module,exports){
"use strict";
var handleSuccess = _dereq_("./assert-promise").handleSuccess;
var handleFailure = _dereq_("./assert-promise").handleFailure;


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
      return handleSuccess(successMessage + extraMessage)();
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

exports.createAllowedTest = createAllowedTest;
exports.createForbidTest = createForbidTest;
},{"./assert-promise":2}]},{},[4])
(4)
});