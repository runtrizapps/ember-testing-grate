
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



function fetchItem(name, source) {
  var fetchFn;

  if (source === 'list' || source === 'random') {
    fetchFn = getRandomFromList.bind(this, name);
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

  return fetchFn();
}


function testList(name) {
  async();
  return getList(name)
    .then(handleSuccess, handleFailure)
    .finally(asyncDone);
}

function testGet(name, source) {
  async();
  fetchItem(name, source)
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
