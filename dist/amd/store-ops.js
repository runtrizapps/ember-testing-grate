define(
  ["./apply-data","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var applyData = __dependency1__.applyData;

    function getStore(App, name) {
      return App.__container__.lookup('store:' + (name || 'main'));
    }

    function getCreateData() {
      var createData = this._grateConfig.create, // todo - make this less sucky (2 of 2, see crudder)
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

    __exports__.getList = getList;
    __exports__.createItem = createItem;
    __exports__.fetchItem = fetchItem;
    __exports__.updateItem = updateItem;
  });