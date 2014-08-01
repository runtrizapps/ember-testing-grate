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
      paramArray.unshift(name);

      if (configEntry !== false && configEntry.forbid !== true && configEntry.allow !== false) {
        test(operationName.pluralize().capitalize() + " tests", function() {
          Ember.run(this, function() {
            allowTest.apply(this, paramArray);
          });
        });
      } else {
        test(operationName.pluralize().capitalize() + " forbidden", function() {
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
        return newObject.then(resolve);
      }
    }

    var key, val;

    for (key in data) {
      if (data.hasOwnProperty(key)) {
        val = data[key];

        if (typeof val === 'function') {
          val = val.call(this, object.get(key));
        }

        if (typeof val !== 'undefined') {
          object.set(key, val);
        }
      }
    }

    resolve(object);
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
    // TODO - handle create
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

function createAllowedTest(promise, successMessage, failureMessage) {
  async();
  return promise
    .then(handleSuccess(successMessage), handleFailure(failureMessage))
    .finally(asyncDone);
}

function createForbidTest(promise, successMessage, failureMessage) {
  async();
  return promise
    .then(handleFailure(failureMessage), handleSuccess(successMessage))
    .finally(asyncDone);
}

function testUpdate(name, source, data) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return updateItem(item, data);
      }),
    name + " is updatable",
    name + " failed to be updated"
  );
}

function forbidUpdate(name, source, data) {
  return createForbidTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return updateItem(item, data);
      }),
    name + " cannot be updated",
    name + " should NOT be updatable"
  );
}

function testDelete(name, source) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return item.destroyRecord();
      }),
    name + " is deletable",
    name + " failed to be deleted"
  );
}

function forbidDelete(name, source) {
  return createForbidTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return item.destroyRecord();
      }),
    name + " cannot be deleted",
    name + " should NOT be deletable"
  );
}

function testCreate(name, data) {
  return createAllowedTest(
    createItem.call(this, name, data),
    name + " is creatable",
    name + " failed to be created"
  );
}

function forbidCreate(name, data) {
  return createForbidTest(
    createItem.call(this, name, data),
    name + " cannot be created",
    name + " should NOT be creatable"
  );
}

function testList(name) {
  return createAllowedTest(
    getList.call(this, name),
    name + " is listable",
    name + " failed to be listed"
  );
}

function forbidList(name) {
  return createForbidTest(
    getList.call(this, name),
    name + " is not listable",
    name + " should NOT be listable"
  );
}

function testGet(name, source) {
  return createAllowedTest(
    fetchItem.call(this, name, source),
    name + " is readable",
    name + " failed to be fetched"
  );
}

function forbidGet(name, source) {
  return createForbidTest(
    fetchItem.call(this, name, source),
    name + " is not readable",
    name + " should NOT be readable"
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
    ok(false, message || "Promise was rejected");
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
