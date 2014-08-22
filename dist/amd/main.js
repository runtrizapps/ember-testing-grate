define(
  ["ember","./crudder","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"] || __dependency1__;
    var testCrud = __dependency2__.testCrud;

    Ember.testing = true;

    function globalize() {
      window.testCrud = testCrud;
    }

    __exports__.testCrud = testCrud;
    __exports__.globalize = globalize;
  });