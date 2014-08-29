import { createAllowedTest } from './test-generators';
import { getList, createItem, fetchItem, updateItem } from './store-ops';
import { handleFailure } from './assert-promise';

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

export { testList, testCreate, testGet, testUpdate, testDelete };
