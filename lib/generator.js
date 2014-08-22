function getStore(App, name) {
  return App.__container__.lookup('store:' + (name || 'main'));
}

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
          this._grateConfig = config;
          Ember.run(this, function() {
            allowTest.apply(this, paramArray);
          });
        });
      } else {
        if (configEntry.statusCode) {
          paramArray.push(configEntry.statusCode);
        }
        test(operationName.capitalize() + " forbidden", function() {
          Ember.run(this, function() {
            rejectTest.apply(this, paramArray);
          });
        });
      }
    }
  }

  processOption.call(this, 'list',   config.list,   testList,   forbidList);
  processOption.call(this, 'create', config.create, testCreate, forbidCreate, ['data']);
  processOption.call(this, 'read',   config.read,   testGet,    forbidGet,    ['source']);
  processOption.call(this, 'update', config.update, testUpdate, forbidUpdate, ['source', 'data']);
  processOption.call(this, 'delete', config.delete, testDelete, forbidDelete, ['source']);

}

function getCreateData() {
  var createData = this._grateConfig.create,
      data;

  function processCreateOption(opt) {
    if (opt.allow !== false && opt.forbid !== true) {
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

  Ember.assert('Create is not a valid source for these options', data);
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

      return item.reload();
    });
}

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
    fetchFn = source.bind(this);
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
        equal(error.jqXHR.status, statusCode, "returns expected HTTP " + statusCode + " response");
      }
      return handleSuccess(successMessage + extraMessage)();
    })
    .finally(asyncDone);
}

function testUpdate(name, source, data, message) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return updateItem(item, data);
      }),
    name + " is updatable",
    name + " failed to be updated",
    message
  );
}

function forbidUpdate(name, source, data, message, statusCode) {
  return createForbidTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return updateItem(item, data);
      }),
    name + " cannot be updated",
    name + " should NOT be updatable",
    message,
    statusCode
  );
}

function testDelete(name, source, message) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return item.destroyRecord();
      }),
    name + " is deletable",
    name + " failed to be deleted",
    message
  );
}

function forbidDelete(name, source, message, statusCode) {
  return createForbidTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return item.destroyRecord();
      }),
    name + " cannot be deleted",
    name + " should NOT be deletable",
    message,
    statusCode
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

function forbidCreate(name, data, message, statusCode) {
  return createForbidTest(
    createItem.call(this, name, data),
    name + " cannot be created",
    name + " should NOT be creatable",
    message,
    statusCode
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

function forbidList(name, message, statusCode) {
  return createForbidTest(
    getList.call(this, name),
    name + " is not listable",
    name + " should NOT be listable",
    message,
    statusCode
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

function forbidGet(name, source, message, statusCode) {
  return createForbidTest(
    fetchItem.call(this, name, source),
    name + " is not readable",
    name + " should NOT be readable",
    message,
    statusCode
  );
}

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
    }
    ok(false, (message || "Promise was rejected") + errorPrintout);
    return arg;
  };
}
function async() {
  QUnit.stop();
}
function asyncDone(arg) {
  QUnit.start();
  return arg;
}


export { testCrud };
