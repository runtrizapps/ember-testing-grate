"use strict";
var createAllowedTest = require("./test-generators").createAllowedTest;
var getList = require("./store-ops").getList;
var createItem = require("./store-ops").createItem;
var fetchItem = require("./store-ops").fetchItem;
var updateItem = require("./store-ops").updateItem;
var getStore = require("./store-ops").getStore;
var handleFailure = require("./assert-promise").handleFailure;

function capturePayload(store, item, resultArray) {
  var serializer = store.serializerFor(item);
  serializer.reopen({
    extract: function(store, type, payload) {
      resultArray.clear();
      resultArray.unshift(payload);
      return this._super.apply(this, arguments);
    }
  });
}

function returnResults(array) {
  return function(result) {
    array.unshift(result);
    return array;
  };
}

function testUpdate(name, source, data, message) {
  var results = [];
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        capturePayload(item.store, item, results);
        return updateItem(item, data);
      }, handleFailure("Failed to obtain model for updating"))

      .then(returnResults(results)),
    name + " is updatable",
    name + " failed to be updated",
    message
  );
}

function testDelete(name, source, message) {
  var results = [];
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        if (item.get('currentState.stateName').match(/created/)) {
          item.transitionTo('saved');
        }
        capturePayload(item.store, item, results);
        return item.destroyRecord();
      }, handleFailure("Failed to obtain model for deleting"))

      .then(returnResults(results)),
    name + " is deletable",
    name + " failed to be deleted",
    message
  );
}

function testCreate(name, data, message) {
  var results = [];
  capturePayload(getStore(this.App), name, results);
  return createAllowedTest(
    createItem.call(this, name, data)
      .then(returnResults(results)),
    name + " is creatable",
    name + " failed to be created",
    message
  );
}

function testList(name, message) {
  var results = [];
  capturePayload(getStore(this.App), name, results);
  return createAllowedTest(
    getList.call(this, name)
      .then(returnResults(results)),
    name + " is listable",
    name + " failed to be listed",
    message
  );
}

function testGet(name, source, message) {
  var results = [];
  capturePayload(getStore(this.App), name, results);
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(returnResults(results)),
    name + " is readable",
    name + " failed to be fetched",
    message
  );
}

exports.testList = testList;
exports.testCreate = testCreate;
exports.testGet = testGet;
exports.testUpdate = testUpdate;
exports.testDelete = testDelete;