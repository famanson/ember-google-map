import Ember from 'ember';
import ArrayController from 'ember-legacy-controllers/array'

var computed = Ember.computed;

/**
 * @class GoogleMapPolylinesController
 * @extends Ember.ArrayController
 */
export default ArrayController.extend({
  itemController: computed.alias('parentController.polylineController'),
  model:          computed.alias('parentController.polylines'),
  pathController: computed.alias('parentController.polylinePathController')
});
