"use strict";
var Ember = require("ember")["default"] || require("ember");
var testCrud = require("./generator").testCrud;

Ember.testing = true;

function globalize() {
  window.testCrud = testCrud;
}

exports.testCrud = testCrud;