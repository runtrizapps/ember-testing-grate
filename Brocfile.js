var makeModules = require('broccoli-dist-es6-module');

module.exports = makeModules('lib', {
  global: 'emgrate',
  packageName: 'ember-testing-grate',
  main: 'main',
  shim: {
    'ember': 'Ember',
    'qunit': 'QUnit'
  }
});

