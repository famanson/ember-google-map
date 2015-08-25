import Ember from 'ember';
import ArrayController from 'ember-legacy-controllers/array'

var computed = Ember.computed;

/**
 * @class GoogleMapInfoWindowsController
 * @extends Ember.ArrayController
 */
export default ArrayController.extend({
  itemController: computed.alias('parentController.infoWindowController'),
  model:          computed.alias('parentController.infoWindows')
});
