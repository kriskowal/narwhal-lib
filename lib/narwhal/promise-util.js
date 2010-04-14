
/**
 * @extends narwhal/util
 * @module
 */

var QUTIL = exports;
var UTIL = require("./util");
var Q = require("./promise");
var EL = require("narwhal/event-loop");
// EL had to be explicated with a top-level identifier
// since some loaders do not scan require.paths on relative
// identifiers.

UTIL.update(QUTIL, Q);

/**
 * @param {Number} timeout
 * @returns {Promise * undefined} a promise for `undefined`
 * that will resolve after `timeout` miliseconds.
 */
QUTIL.delay = function (timeout) {
    var deferred = Q.defer();
    EL.setTimeout(deferred.resolve, timeout);
    return deferred.promise;
};

/** */
QUTIL.reduce = function (values, callback, basis) {
    return Q.when(values, function (values) {
        return values.reduce(function (values, value) {
            return Q.when(values, function (values) {
                return Q.when(value, function (value) {
                    return callback(values, value);
                });
            });
        }, basis);
    });
};

/**
 * @param {Array * Promise} values that may include promises.
 * @returns {Promise * Array} a promise for an array of each
 * resolved value respectively.
 */
QUTIL.group = function (values) {
    return QUTIL.reduce(values, function (values, value) {
        return values.concat([value]);
    }, []);
};

/**
 */
QUTIL.forEach = function (values, callback, thisp) {
    var last;
    return Q.when(values.forEach(function (value) {
        last = Q.when(last, function () {
            return Q.when(value, function (value) {
                return callback.call(thisp, value);
            });
        });
    }), function () {
        return last;
    });
};

/**
 * @param {Array * Promise} values a promise for an array of
 * promises.
 * @returns {Promise * Array} a promise for the sum of the
 * resolved.
 */
QUTIL.sum = function (values) {
    return QUTIL.reduce(values, function (values, value) {
        return values + value;
    }, 0);
};

/**
 * Wraps a `when` block
 * @param {Array * Promise}
 * @param {Function} resolved
 * @param {Function} rejected optional
 */
QUTIL.whenAll = function (values, resolved, rejected) {
    return Q.when(QUTIL.group(values), resolved, rejected);
};

/**
 * @param {Array * Promise} values
 * @param {Function} callback
 * @param {Promise * Object} thisp optional this object for
 * the callback
 * @returns {Array * Promise} an array of promises for the
 * returned results of the callback on each respective
 * resolved value.
 */
QUTIL.mapDefer = function (values, callback, thisp) {
    return values.map(function (value) {
        return Q.when(value, function (value) {
            return Q.when(thisp, function (thisp) {
                return callback.call(thisp);
            });
        });
    });
};

/**
 * @param {Array * Promise} values
 * @param {Function} callback
 * @param {Promise * Object} thisp optional this object for
 * the callback
 * @returns {Promise * Array} a promise for an array of the
 * returned results of the callback on each respective
 * resolved value.
 */
QUTIL.map = function (values, callback, thisp) {
    return QUTIL.group(QUTIL.mapDefer(values, callback, thisp));
};

/**
 * A promise queue.  Each promise returned by get is
 * eventually resolved by a value given to put, in the order
 * in which they are requested and received.
 */
QUTIL.Queue = function (max) {
    if (max === undefined)
        max = Infinity;
    var self = Object.create(QUTIL.Queue.prototype);
    var promises = [];
    var resolvers = [];

    function grow() {
        if (promises.length > max || resolvers.length > max)
            return false;
        var deferred = Q.defer();
        promises.push(deferred.promise);
        resolvers.push(deferred.resolve);
        return true;
    };

    /***
     * @returns a promise
     */
    self.get = function () {
        if (!promises.length) {
            if (!grow())
                return Q.reject("queue jammed");
        }
        return promises.shift();
    };

    /***
     * @param value a resolution
     */
    self.put = function (value) {
        if (!resolvers.length) {
            if (!grow())
                return Q.reject("queue jammed");
        }
        resolvers.shift()(value);
    };

    return self;
};

/* demo */
if (module === require.main) {
    QUTIL.whenAll([
        1,2,3,Q.when(QUTIL.delay(1000), function () {return 4})
    ], function (values) {
        print(values);
    });
}

