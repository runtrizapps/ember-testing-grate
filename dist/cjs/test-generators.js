"use strict";
var handleSuccess = require("./assert-promise").handleSuccess;
var handleFailure = require("./assert-promise").handleFailure;


function createAllowedTest(promise, successMessage, failureMessage, extraMessage) {
  async();
  extraMessage = extraMessage ? ' - ' + extraMessage : '';
  return promise
    .then(handleSuccess(successMessage + extraMessage), handleFailure(failureMessage + extraMessage))
    .finally(asyncDone);
}

function createForbidTest(promise, successMessage, failureMessage, extraMessage, statusCode) {
  if (extraMessage && !statusCode) {
    if (typeof extraMessage === 'number' || !isNaN(parseInt(extraMessage, 10))) {
      statusCode = extraMessage;
      extraMessage = null;
    }
  }
  async();
  extraMessage = extraMessage ? ' - ' + extraMessage : '';
  return promise
    .then(handleFailure(failureMessage + extraMessage))
    .catch(function(error) {
      if (statusCode) {
        equal(error.jqXHR.status, statusCode, "returns expected HTTP " + statusCode + " response");
      }
      return handleSuccess(successMessage + extraMessage)();
    })
    .finally(asyncDone);
}

function async() {
  QUnit.stop();
}
function asyncDone(arg) {
  QUnit.start();
  return arg;
}

exports.createAllowedTest = createAllowedTest;
exports.createForbidTest = createForbidTest;