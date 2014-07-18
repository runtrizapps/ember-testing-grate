import Ember              from 'ember';
import { generate } from './generator';

Ember.testing = true;

function globalize() {
  // window.exportname = exportname;
}

export {
  generate
};

