Ember Testing Grate
===========

## Note - below readme is for ember-qunit. TODO!

About
-----

Ember QUnit uses your application's resolver to find and automatically
create test subjects for you with the `moduleFor` and `test` helpers.

*This is a work in progress* but its also quite handy already. Feedback
is highly encouraged.

Simple Usage
------------

Include `dist/globals/main.js` as a script in your tests index.html

Module Formats
--------------

You will find all the popular formats in `dist/`.

Examples
--------

### Importing the `testCrud` helper

```js
// In yo' test
import { testCrud } from 'ember-testing-grate';
```

### Simple usage:

```js
module("Cart model tests", {
  setup: function() {
    App = this.App = startApp();
    // NOTE - you **MUST** attach App to `this.App` in test setup!
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});


testCrud(test, 'cart', {
  list: true,

  read: {
    source: 'listRandom' // Can be `listRandom` OR a static seed's {ID}
  },

  create: { // Will create a cart with the specified mock data
    data: {
      name: "Test cart"
    }
  },

  update: { // Will pick a random cart, update the name, and save
    source: 'listRandom',
    data: {
      name: "New name for cart!"
    }
  },

  delete: { // Will delete a randomly selected cart
    source: 'listRandom'
  }
});
```

### Complex example with login helper

```js
import { testCrud } from 'ember-testing-grate';
import { login } from 'rms/tests/helpers/login';

var App;

module("Cart model tests - Champion user", {
  setup: function() {
    App = this.App = startApp();
    QUnit.stop();
    login("champion", "runtriz123")
      .then(QUnit.start);
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

testCrud(test, 'cart', {
  create: { // Will create a cart with the specified mock data
    data: {
      name: "Test cart"
    }
  }
});

module("Cart model tests - Standard user", {
  setup: function() {
    App = this.App = startApp();
    QUnit.stop();
    login("st", "runtriz123")
      .then(QUnit.start);
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

testCrud(test, 'cart', {
  create: { // Will verify that a cart CANNOT be created with this mock data
    allow: false,
    data: {
      name: "Test cart"
    }
  }
});

```
