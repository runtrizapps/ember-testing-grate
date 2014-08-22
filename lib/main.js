import Ember from 'ember';
import { testCrud } from './crudder';

Ember.testing = true;

function globalize() {
  window.testCrud = testCrud;
}

export {
  testCrud,
  globalize
};

