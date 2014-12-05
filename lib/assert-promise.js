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

      if (arg.jqXHR.responseText) {
        errorPrintout += "Response: " + arg.jqXHR.responseText.substr(0, 450);
      }

    } else if (arg.status) {
      errorPrintout += "\nStatus: " + arg.status;
    }
    ok(false, (message || "Promise was rejected") + errorPrintout);
    return arg;
  };
}

export { handleSuccess, handleFailure };
