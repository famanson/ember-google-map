/* globals google */
import Ember from 'ember';
import helpers from '../core/helpers';
import beforeObserver from 'ember-legacy-controllers/support/before-observer';

var computed = Ember.computed;

var EMPTY = [];

/**
 * @extension GoogleArrayMixin
 * @mixin GoogleArrayMixin
 */
export default Ember.Mixin.create({

  googleArray: computed({
    get() {
      if (!helpers.hasGoogleLib()) {
        return;
      }
      return new google.maps.MVCArray(
        this._ember2google(this._startObservingEmberProperties(this.toArray().slice(), true), true)
      );
    },
    set(key, value) {
      var array = value ? value.getArray().slice() : [];
      this.set('observersEnabled', false);
      this.replace(0, this.get('length') || 0, this._startObservingEmberProperties(
        this._google2ember(array, true), true
      ));
      this.set('observersEnabled', true);
      return value;
    }
  }),

  emberItemFactory:       null,
  googleItemFactory:      null,
  observeEmberProperties: null,

  _google2ember: function (item, isArray) {
    if (this.emberItemFactory) {
      if (isArray) {
        for (var i = 0; i < item.length; i++) {
          item[i] = this.emberItemFactory(item[i]);
        }
      }
      else {
        item = this.emberItemFactory(item);
      }
    }
    return item;
  },

  _ember2google: function (item, isArray) {
    if (this.googleItemFactory) {
      if (isArray) {
        for (var i = 0; i < item.length; i++) {
          item[i] = this.googleItemFactory(item[i]);
        }
      }
      else {
        item = this.googleItemFactory(item);
      }
    }
    return item;
  },

  _startObservingEmberProperties: function (object, isArray) {
    var props = this.get('observeEmberProperties'), emberArray = this;
    if (props && props.length) {
      var one = function (obj) {
        for (var i = 0; i < props.length; i++) {
          Ember.addObserver(obj, props[i], emberArray, '_handleObjectPropertyChange');
        }
      };
      if (isArray) {
        for (var i = 0; i < object.length; i++) {
          one(object[i]);
        }
      }
      else {
        one(object);
      }
    }
    return object;
  },

  _stopObservingEmberProperties: function (object, isArray) {
    var props = this.get('observeEmberProperties'), emberArray = this;
    if (props && props.length) {
      var one = function (obj) {
        for (var i = 0; i < props.length; i++) {
          Ember.removeObserver(obj, props[i], emberArray, '_handleObjectPropertyChange');
        }
      };
      if (isArray) {
        for (var i = 0; i < object.length; i++) {
          one(object[i]);
        }
      }
      else {
        one(object);
      }
    }
    return object;
  },

  _handleObjectPropertyChange: function (sender/*, key, value*/) {
    var index = -1, array, googleArray;
    if (this.get('observersEnabled')) {
      this.set('observersEnabled', false);
      array = this.toArray();
      googleArray = this.get('googleArray');
      while ((index = array.indexOf(sender, index + 1)) !== -1) {
        googleArray.setAt(index, this._ember2google(array[index]));
      }
      this.set('observersEnabled', true);
    }
  },

  googleListenersEnabled: null,

  observersEnabledLevel: 0,

  observersEnabled: computed({
    get() {
      return this.get('observersEnabledLevel') === 0;
    },
    set(key, value) {
      return this.incrementProperty('observersEnabledLevel', value ? 1 : -1) === 0;
    }
  }),

  setupGoogleArray: Ember.observer('googleArray', Ember.on('init', function () {
    var googleArray = this.get('googleArray');
    Ember.warn('setting up a google array but it has not been teardown first', !this._googleListeners);
    if (googleArray) {
      // setup observers/events
      this._googleListeners = {
        insertAt: googleArray.addListener('insert_at', this.handleGoogleInsertAt.bind(this)),
        removeAt: googleArray.addListener('remove_at', this.handleGoogleRemoveAt.bind(this)),
        setAt:    googleArray.addListener('set_at', this.handleGoogleSetAt.bind(this))
      };
    }
  })),

  teardownGoogleArray: beforeObserver('googleArray', Ember.on('destroy', function () {
    if (this._googleListeners) {
      if (helpers.hasGoogleLib()) {
        // teardown observers/events
        for (var k in this._googleListeners) {
          if (this._googleListeners.hasOwnProperty(k)) {
            google.maps.event.removeListener(this._googleListeners[k]);
          }
        }
      }
      this._googleListeners = null;
    }
    this._stopObservingEmberProperties(this.toArray(), true);
  })),

  handleGoogleInsertAt: function (index) {
    if (this.get('observersEnabled')) {
      this.set('observersEnabled', false);

      var modelName = this.get('firstObject').constructor.modelName;
      var newObject = this._google2ember(this.get('googleArray').getAt(index));

      if (modelName) {
        var record = this.store.createRecord(modelName, JSON.parse(JSON.stringify(newObject)));
        this.insertAt(index, record);
        this._startObservingEmberProperties(record);
      } else {
        this.replace(index, 0, [
          this._startObservingEmberProperties(newObject)
        ]);
      }

      this.set('observersEnabled', true);
    }
  },

  handleGoogleRemoveAt: function (index) {
    if (this.get('observersEnabled')) {
      this.set('observersEnabled', false);
      this._stopObservingEmberProperties(this.objectAt(index));
      this.replace(index, 1, EMPTY);
      this.set('observersEnabled', true);
    }
  },

  handleGoogleSetAt: function (index) {
    if (this.get('observersEnabled')) {
      var object = this.objectAt(index);

      this.set('observersEnabled', false);

      var newObject = this._google2ember(this.get('googleArray').getAt(index))

      if (Ember.typeOf(object) === 'instance') {
        object.setProperties(newObject);
      } else {
        this._stopObservingEmberProperties(object);
        this.replace(index, 1, [newObject]);
        this._startObservingEmberProperties(newObject);
      }

      this.set('observersEnabled', true);
    }
  },

  arrayContentDidChange: function (start, removeCount, addCount) {
    this._super.apply(this, arguments);

    if (Ember.isNone(removeCount)) { return }

    var i, googleArray, slice;
    this._super.apply(this, arguments);
    if (this.get('observersEnabled')) {
      this.set('observersEnabled', false);
      googleArray = this.get('googleArray');
      for (i = 0; i < removeCount; i++) {
        var obj = this.objectAt(start);
        if (obj) {
          this._stopObservingEmberProperties(obj);
        }
        googleArray.removeAt(start);
      }
      slice = this._ember2google(
        this._startObservingEmberProperties(this.toArray().compact().slice(start, start + addCount), true), true
      );
      while (slice.length) {
        googleArray.insertAt(start, slice.pop());
      }
      this.set('observersEnabled', true);
    }
  }
});
