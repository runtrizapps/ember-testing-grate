"use strict";
var createAllowedTest = require("./test-generators").createAllowedTest;
var getList = require("./store-ops").getList;
var createItem = require("./store-ops").createItem;
var fetchItem = require("./store-ops").fetchItem;
var updateItem = require("./store-ops").updateItem;

function testUpdate(name, source, data, message) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return updateItem(item, data);
      }),
    name + " is updatable",
    name + " failed to be updated",
    message
  );
}

function testDelete(name, source, message) {
  return createAllowedTest(
    fetchItem.call(this, name, source)
      .then(function(item) {
        return item.destroyRecord();
      }),
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

exports.testList = testList;
exports.testCreate = testCreate;
exports.testGet = testGet;
exports.testUpdate = testUpdate;
exports.testDelete = testDelete;