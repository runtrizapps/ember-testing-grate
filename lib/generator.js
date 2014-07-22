var store;

function generate(name, config) {

  store = config.store;

  if (config.list) {
    testList.call(this, name);
  }
  if (config.create) {
    testCreate.call(this, name, config.create.data);
  }
  if (config.read) {
    testGet.call(this, name, config.read.source);
  }
  if (config.update) {
    testUpdate.call(this, name, config.update.source, config.update.data);
  }
  if (config.delete) {
    testDelete.call(this, name, config.delete.source);
  }
}

function getList(name) {
  return store.find(name);
}
function getRandomFromList(name) {
  return getList(name)
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

  var newObject = store.createRecord(name),
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
}

function testCreate(name, data) {
  return createAllowedTest(
    createItem.call(this, name, data),
    name + " is creatable",
    name + " failed to be created"
  );
}
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
}

function handleSuccess(message) {
  return function(arg) {
    ok(true, message || "Promise resolved successfully");
    return arg;
  }
}
function handleFailure(message) {
  return function(arg) {
    ok(false, message || "Promise was rejected");
    return arg;
  }
}
function async() {
  QUnit.stop();
}
function asyncDone(arg) {
  QUnit.start();
  return arg;
}


export { generate };
