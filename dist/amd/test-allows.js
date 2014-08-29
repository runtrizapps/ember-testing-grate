define(
  ["./test-generators","./store-ops","./assert-promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var createAllowedTest = __dependency1__.createAllowedTest;
    var getList = __dependency2__.getList;
    var createItem = __dependency2__.createItem;
    var fetchItem = __dependency2__.fetchItem;
    var updateItem = __dependency2__.updateItem;
    var handleFailure = __dependency3__.handleFailure;

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
            if (item.get('currentState.stateName').match(/created/)) {
              item.transitionTo('saved');
            }
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

    __exports__.testList = testList;
    __exports__.testCreate = testCreate;
    __exports__.testGet = testGet;
    __exports__.testUpdate = testUpdate;
    __exports__.testDelete = testDelete;
  });