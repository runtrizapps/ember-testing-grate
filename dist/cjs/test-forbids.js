"use strict";
var createForbidTest = require("./test-generators").createForbidTest;
var getList = require("./store-ops").getList;
var createItem = require("./store-ops").createItem;
var fetchItem = require("./store-ops").fetchItem;
var updateItem = require("./store-ops").updateItem;
var handleFailure = require("./assert-promise").handleFailure;

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

exports.forbidList = forbidList;
exports.forbidCreate = forbidCreate;
exports.forbidGet = forbidGet;
exports.forbidUpdate = forbidUpdate;
exports.forbidDelete = forbidDelete;