
function generate(config) {
  var testModel = this.subject(),
      name = testModel.constructor.typeKey;
}

function getList(name) {
  return this.store.find(name);
}
function getRandomFromList(name) {
  return getList(name)
    .then(function(list) {
      var length = list.get('length'),
          rand = Math.floor(Math.random() * length),
          item = list.objectAt(rand);

      return item;
    });
}

function createItem(name, data) {
  if (typeof data === 'function') {
    return createItem.bind(this)().save(); // TODO - detect if promise
  }

  var newObject = this.subject(),
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
    fetchFn = this.store.find.bind(this, name, source);
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

function testUpdate(name, source, data) {
  async();
  return fetchItem(name, source)
    .then(function(item) {
      return updateItem(item, data);
    })
    .then(handleSuccess, handleFailure)
    .finally(asyncDone);
}

function testDelete(name, source) {
  async();
  return fetchItem(name, source)
    .then(function(item) {
      return item.destroyRecord();
    })
    .then(handleSuccess, handleFailure)
    .finally(asyncDone);
}

function testCreate(name, data) {
  async();
  return createItem(name, data)
    .then(handleSuccess, handleFailure)
    .finally(asyncDone);
}

function testList(name) {
  async();
  return getList.call(this, name)
    .then(handleSuccess, handleFailure)
    .finally(asyncDone);
}

function testGet(name, source) {
  async();
  return fetchItem(name, source)
    .then(handleSuccess, handleFailure)
    .finally(asyncDone);
}

function handleSuccess(arg) {
  ok(true, "Promise resolved successfully");
  return arg;
}
function handleFailure(arg) {
  ok(false, "Promise was rejected");
  return arg;
}
function async() {
  QUnit.stop();
}
function asyncDone(arg) {
  QUnit.start();
  return arg;
}
