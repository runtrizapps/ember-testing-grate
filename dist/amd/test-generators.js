define(
  ["./assert-promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var handleSuccess = __dependency1__.handleSuccess;
    var handleFailure = __dependency1__.handleFailure;


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
            equal(error.status || error.jqXHR && error.jqXHR.status, statusCode, "returns expected HTTP " + statusCode + " response");
          }
          return handleSuccess(successMessage + extraMessage)(error);
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

    __exports__.createAllowedTest = createAllowedTest;
    __exports__.createForbidTest = createForbidTest;
  });