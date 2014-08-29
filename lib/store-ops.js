import { applyData } from './apply-data';

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
  if (item.get('currentState.stateName').match(/created/)) {
    item.transitionTo('update.uncommitted');
  }
  return applyData.call(this, item, data || {})
    .then(function(object) {
      return object.save();
    });
}

export { getList, createItem, fetchItem, updateItem };
