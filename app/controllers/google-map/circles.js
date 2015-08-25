import Ember from 'ember';
import ArrayController from 'ember-legacy-controllers/array'

var computed = Ember.computed;

/**
 * @class GoogleMapCirclesController
 * @extends Ember.ArrayController
 */
export default ArrayController.extend({
  itemController: computed.alias('parentController.circleController'),
  model:          computed.alias('parentController.circles')
});
