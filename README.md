Ember Testing Grate
===========

About
-----

Ember-testing-grate allows for easy spin-up of API integration tests 
using your Ember Data models.

*This is a work in progress* but its also quite handy already. Feedback
is highly encouraged.

Simple Usage
------------
### Ember-CLI

Add to Brocfile
```js
// Brocfile.js
if (app.tests) app.import('bower_components/ember-testing-grate/dist/named-amd/main.js', {
  exports: {
    'ember-testing-grate': ['testCrud']
  }
});
```
In your tests..
```js
// In your test
import { testCrud } from 'ember-testing-grate';
```

### Global use
Include `dist/globals/main.js` as a script in your tests index.html.

Then, run `emgrate.globablize();`  
Now, `window.testCrud` is available for use.


Module Formats
--------------

You will find all the popular formats in `dist/`.

Examples
--------

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


testCrud(test, 'cart', { // NOTE - you **MUST** pass the QUnit `test` function first!
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

### Configuration

#### testCrud(qUnitTestFunction, modelName, options)
Options is specified as follows:
```js
{
  list: true or false, // short for `{ allow: true }` or `{ allow: false }`

  read: {
    source: 'listRandom' or Static seed ID
    allow: true or false (default: true)
  },

  create: {
    data: { .. Mock Data .. }
    allow: true or false (default: true)
  },

  update: {
    source: 'listRandom' or Static seed ID
    data: { .. Mock Data .. }
    allow: true or false (default: true)
  },

  delete: { 
    source: 'listRandom' or Static seed ID
  }
}
```
