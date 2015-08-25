import Ember from 'ember';
import ArrayController from 'ember-legacy-controllers/array'

var computed = Ember.computed;

/**
 * @class GoogleMapMarkersController
 * @extends Ember.ArrayController
 */
export default ArrayController.extend({
  itemController: computed.alias('parentController.markerController'),
  model:          computed.alias('parentController.markers')
});
