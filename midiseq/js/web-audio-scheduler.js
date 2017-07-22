(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebAudioScheduler = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
"use strict";

var AudioContext = global.AudioContext || global.webkitAudioContext;

function defaults(value, defaultValue) {
  return value !== undefined ? value : defaultValue;
}

/**
 * @class WebAudioScheduler
 */

var WebAudioScheduler = (function () {
  /**
   * @constructor
   * @param {object} opts
   * @public
   */

  function WebAudioScheduler() {
    var opts = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, WebAudioScheduler);

    this.context = opts.context || new AudioContext();
    this.interval = +defaults(opts.interval, 0.025);
    this.aheadTime = +defaults(opts.aheadTime, 0.1);
    this.offsetTime = +defaults(opts.offsetTime, 0.005);
    this.timerAPI = defaults(opts.timerAPI, global);
    this.toSeconds = defaults(opts.toSeconds, function (value) {
      return +value;
    });
    this.playbackTime = 0;

    this._timerId = 0;
    this._schedId = 0;
    this._events = [];
  }

  _createClass(WebAudioScheduler, [{
    key: "currentTime",

    /**
    * Current time of the audio context
    * @type {number}
    * @public
    */
    get: function () {
      return this.context.currentTime;
    }
  }, {
    key: "events",

    /**
     * Sorted list of scheduled items
     * @type {object[]}
     * @public
     */
    get: function () {
      return this._events.slice();
    }
  }, {
    key: "start",

    /**
     * Start the scheduler timeline.
     * @param {function} callback
     * @return {WebAudioScheduler} self
     * @public
     */
    value: function start(callback) {
      var _this = this;

      if (this._timerId === 0) {
        this._timerId = this.timerAPI.setInterval(function () {
          var t0 = _this.context.currentTime;
          var t1 = t0 + _this.aheadTime;

          _this._process(t0, t1);
        }, this.interval * 1000);
      }
      if (callback) {
        this.insert(0, callback);
      }
      return this;
    }
  }, {
    key: "stop",

    /**
     * Stop the scheduler timeline.
     * @param {boolean} reset
     * @return {WebAudioScheduler} self
     * @public
     */
    value: function stop(reset) {
      if (this._timerId !== 0) {
        this.timerAPI.clearInterval(this._timerId);
        this._timerId = 0;
      }
      if (reset) {
        this._events.splice(0);
      }
      return this;
    }
  }, {
    key: "insert",

    /**
     * Insert the callback function into the scheduler timeline.
     * @param {number} time
     * @param {function(object)} callback
     * @param {*[]} args
     * @return {number} schedId
     * @public
     */
    value: function insert(time, callback, args) {
      time = this.toSeconds(time, this);

      this._schedId += 1;

      var event = {
        id: this._schedId,
        time: time,
        callback: callback,
        args: args
      };
      var events = this._events;

      if (events.length === 0 || events[events.length - 1].time <= time) {
        events.push(event);
      } else {
        for (var i = 0, imax = events.length; i < imax; i++) {
          if (time < events[i].time) {
            events.splice(i, 0, event);
            break;
          }
        }
      }

      return event.id;
    }
  }, {
    key: "nextTick",

    /**
     * Insert the callback function at next tick.
     * @param {function(object)} callback
     * @param {*[]} args
     * @return {number} schedId
     * @public
     */
    value: function nextTick(callback, args) {
      return this.insert(this.playbackTime + this.aheadTime, callback, args);
    }
  }, {
    key: "remove",

    /**
     * Remove the callback function from the scheduler timeline.
     * @param {number} schedId
     * @return {number} schedId
     * @public
     */
    value: function remove(schedId) {
      var events = this._events;

      if (typeof schedId === "undefined") {
        events.splice(0);
      } else {
        for (var i = 0, imax = events.length; i < imax; i++) {
          if (schedId === events[i].id) {
            events.splice(i, 1);
            break;
          }
        }
      }

      return schedId;
    }
  }, {
    key: "_process",

    /**
     * @private
     */
    value: function _process(t0, t1) {
      var events = this._events;

      this.playbackTime = t0;

      while (events.length && events[0].time < t1) {
        var _event = events.shift();

        this.playbackTime = Math.max(this.context.currentTime, _event.time) + this.offsetTime;

        _event.callback.apply(this, [{
          target: this,
          playbackTime: this.playbackTime
        }].concat(_event.args));
      }

      this.playbackTime = t0;
    }
  }]);

  return WebAudioScheduler;
})();

exports["default"] = WebAudioScheduler;
module.exports = exports["default"];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});