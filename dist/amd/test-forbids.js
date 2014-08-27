define(
  ["./test-generators","./store-ops","./assert-promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var createForbidTest = __dependency1__.createForbidTest;
    var getList = __dependency2__.getList;
    var createItem = __dependency2__.createItem;
    var fetchItem = __dependency2__.fetchItem;
    var updateItem = __dependency2__.updateItem;
    var handleFailure = __dependency3__.handleFailure;

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

    __exports__.forbidList = forbidList;
    __exports__.forbidCreate = forbidCreate;
    __exports__.forbidGet = forbidGet;
    __exports__.forbidUpdate = forbidUpdate;
    __exports__.forbidDelete = forbidDelete;
  });