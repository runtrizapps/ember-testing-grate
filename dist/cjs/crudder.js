"use strict";
var testList = require("./test-allows").testList;
var testCreate = require("./test-allows").testCreate;
var testGet = require("./test-allows").testGet;
var testUpdate = require("./test-allows").testUpdate;
var testDelete = require("./test-allows").testDelete;
var forbidList = require("./test-forbids").forbidList;
var forbidCreate = require("./test-forbids").forbidCreate;
var forbidGet = require("./test-forbids").forbidGet;
var forbidUpdate = require("./test-forbids").forbidUpdate;
var forbidDelete = require("./test-forbids").forbidDelete;

function testCrud(test, name, config) {

  function processOption(operationName, configEntry, allowTest, rejectTest, configKeys) {

    if (typeof configEntry !== 'undefined') {
      if (Array.isArray(configEntry)) {
        for (var n = 0, m = configEntry.length; n < m; n++) {
          processOption.call(this, operationName, configEntry[n], allowTest, rejectTest, configKeys);
        }
        return;
      }

      var paramArray = [];
      if (configKeys) {
        for (var i = 0, l = configKeys.length; i < l; i++) {
          paramArray.push(configEntry[configKeys[i]]);
        }
      }
      if (configEntry.message) {
        paramArray.push(configEntry.message);
      }
      paramArray.unshift(name);

      if (configEntry !== false && configEntry.forbid !== true && configEntry.allow !== false) {
        test(operationName.capitalize() + " tests", function() {
          this._grateConfig = config; // todo - make this less sucky (1 of 2, see store-ops)
          Ember.run(this, function() {
            allowTest.apply(this, paramArray)
              .then(function(item) {
                if (typeof configEntry.then === 'function' && item instanceof DS.Model) {
                  configEntry.then.call(this, item);
                }
              });
          });
        });
      } else {
        if (configEntry.statusCode) {
          paramArray.push(configEntry.statusCode);
        }
        test(operationName.capitalize() + " forbidden", function() {
          Ember.run(this, function() {
            rejectTest.apply(this, paramArray);
          });
        });
      }
    }
  }

  processOption.call(this, 'list',   config.list,   testList,   forbidList);
  processOption.call(this, 'create', config.create, testCreate, forbidCreate, ['data']);
  processOption.call(this, 'read',   config.read,   testGet,    forbidGet,    ['source']);
  processOption.call(this, 'update', config.update, testUpdate, forbidUpdate, ['source', 'data']);
  processOption.call(this, 'delete', config.delete, testDelete, forbidDelete, ['source']);

}

exports.testCrud = testCrud;