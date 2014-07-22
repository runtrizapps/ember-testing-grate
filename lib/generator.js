var store;

function getStore(App, name) {
  return App.__container__.lookup('store:' + (name || 'main'));
}

function generate(test, name, config) {

  if (config.list) {
    test("Listing tests", function() {
      testList.call(this, name);
    });
  } else if (config.list === false) {
    test("Listing forbidden", function() {
      forbidList.call(this, name);
    });
  }

  if (config.create) {
    test("Creation tests", function() {
      testCreate.call(this, name, config.create.data);
    });
  }
  if (config.read) {
    test("Read tests", function() {
      testGet.call(this, name, config.read.source);
    });
  }
  if (config.update) {
    test("Update tests", function() {
      testUpdate.call(this, name, config.update.source, config.update.data);
    });
  }
  if (config.delete) {
    test("Delete tests", function() {
      testDelete.call(this, name, config.delete.source);
    });
  }
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

function createItem(name, data) {
  if (typeof data === 'function') {
    return createItem.bind(this)().save(); // TODO - detect if promise
  }

  var newObject = getStore(this.App).createRecord(name),
      key, val;

  for (key in data) {
    if (data.hasOwnProperty(key)) {
      val = data[key];

      if (typeof val === 'function') {
        val = val.call(this, newObject.get(key));
      }

      if (typeof val !== 'undefined') {
        newObject.set(key, val);
      }
    }
  }

  return newObject.save();
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
  debugger;
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


export { generate };
