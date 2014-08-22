define(
  ["exports"],
  function(__exports__) {
    "use strict";
    function handleSuccess(message) {
      return function(arg) {
        ok(true, message || "Promise resolved successfully");
        return arg;
      };
    }
    function handleFailure(message) {
      return function(arg) {
        var errorPrintout = '';
        if (arg.message) errorPrintout += "\nMessage: " + arg.message + "\n";

        if (arg.jqXHR) {
          errorPrintout += "\nStatus: " + arg.jqXHR.status + " " + arg.jqXHR.statusText + "\n" +
                           "Response: " + arg.jqXHR.responseText.substr(0, 450);
        }
        ok(false, (message || "Promise was rejected") + errorPrintout);
        return arg;
      };
    }

    __exports__.handleSuccess = handleSuccess;
    __exports__.handleFailure = handleFailure;
  });