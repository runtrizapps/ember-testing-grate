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

testCrud(test, 'modelName', { // NOTE - you **MUST** provide QUnit `test` function first!
  list: {
    allow: <Boolean> (default true)
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

#### Providing `<Data>` (for create/update)
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

* Relationships work as expected:
```js
// Assume model has: "comments: DS.hasMany('comment')"
  data: {
    comments: function() {
      this.get('comments').pushObject(this.store.createRecord('comment'));
    }
  }
```

#### Specifying a `<Source>` (for update/delete)
A `<Source>` above can be one of:
* `'listRandom'` (if listing allowed) - hits api `(e.g. /api/models)` and picks randomly from list
* `'create'` (if creating allowed) - creates a model on-the-fly to update or delete
* Static ID's : e.g. `5` or `"2"` - handy to assert rules on known seeds
* A function that returns an instance of the model (OR, a promise that resolves to a model)

### More complex example

```js
import { testCrud } from 'ember-testing-grate';

module("Sample Grate tests for Post model", {
  setup: function() {
    this.App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

testCrud(test, 'post', {
  list: {
    allow: true,
    message: "Posts are listable by this user"
  },

  read: [
    { source: 'listRandom' }, // Will fetch a random /api/posts/<ID> after listing
    {
      allow: false,
      message: "Soft-deleted posts should not be fetchable",
      source: 3 // assumes knowledge of seeded Post#3
    }
  ],

  create: [
    {
      allow: false,
      message: "Cannot create a post without an author",
      statusCode: 422, // Server-side validation test
      data: { title: "test" }
    },
    {
      message: "Posts are creatable with related `author` model",
      data: {
        title: "test title",
        author: function() {
          return this.store.find('user', 1); // Set user 1 as author
        }
      }
    }
  ],

  update: {
    allow: false,
    message: "Cannot update a post with a blank title",
    statusCode: 422,
    source: 'listRandom', // tries to update a random post
    data: {
      title: ''
    }
  },

  delete: [
    { source: "create" }, // creates a post, then destroys it
    { source: "listRandom" } // picks a random post & deletes it
  ]
});

```
