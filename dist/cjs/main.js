"use strict";
var Ember = require("ember")["default"] || require("ember");
var testCrud = require("./crudder").testCrud;

Ember.testing = true;

function globalize() {
  window.testCrud = testCrud;
}

exports.testCrud = testCrud;
exports.globalize = globalize;