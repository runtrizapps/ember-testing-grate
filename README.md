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

### Overview:

```js
module("Grate sample tests", {
  setup: function() {
    App = this.App = startApp();
    // NOTE - you **MUST** attach App to `this.App` in test setup!
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

testCrud(test, 'cart', { // NOTE - you **MUST** pass the QUnit `test` function first!
  list: {
    allow: <Boolean>
  },
  read: {
    allow: <Boolean>,
    source: <Source (see below)>
  },
  create: {
    allow: <Boolean>,
    data: <Data (see below)>
  },
  update: {
    allow: <Boolean>,
    data: <Data>,
    source: <Source>
  },
  delete: {
    allow: <Boolean>,
    source: <Source>
  }
});
```

* List/Create/Read/Update/Delete **can also accept Arrays of tests**
* Each test accepts an optional `message: <String>` parameter.
* `allow: false` tests accept a `statusCode: <Number>` HTTP code assertion

#### Providing <Data> (for create/update)
A `<Data>` above can be one of:
* Plain Javascript object:
```js
  data: {
    name: 'test-name'
  }
```
* An object with functions for keys:
```js
  data: {
    name: function() { return 'test-name-' + Math.random();}
  }
```
* A function that returns the prepared model (can return a Promise also):
```js
  data: function() {
    return this.store.createRecord('modelName', {name: 'test-name'});
  }
```

Relationships work as expected:
```js
// Assume model has: "comments: DS.hasMany('comment')"
  data: {
    comments: function() {
      this.get('comments').pushObject(this.store.createRecord('comment'));
    }
  }
```

#### Specifying a <Source> (for update/delete)
When **updating** or **deleting**, we need to point the grate to a model.

A `<Source>` above can be one of:
* `'listRandom'` (if listing allowed) - hits api `(e.g. /api/models)` and picks randomly from list
* `'create'` (if creating allowed) - creates a model on-the-fly to update or delete
* Static ID's : e.g. `5` or `"2"` - handy to assert rules on known seeds
* A function that returns an instance of the model (OR, a promise that resolves to a model)

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
