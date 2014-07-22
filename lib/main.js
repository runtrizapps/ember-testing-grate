import Ember              from 'ember';
import { testCrud } from './generator';

Ember.testing = true;

function globalize() {
  window.testCrud = testCrud;
}

export {
  testCrud
};

