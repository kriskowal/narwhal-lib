
/**
 * @extends narwhal/util
 * @module
 */

var QUTIL = exports;
var UTIL = require("narwhal/util");
var Q = require("narwhal/promise");
var EL = require("event-loop");

UTIL.update(QUTIL, Q);

/** */
QUTIL.delay = function (timeout) {
    var deferred = Q.defer();
    EL.setTimeout(deferred.resolve, timeout);
    return deferred.promise;
};

/** */
QUTIL.reduce = function (values, relation, basis) {
    return Q.when(values, function (values) {
        return values.reduce(function (values, value) {
            return Q.when(values, function (values) {
                return Q.when(value, function (value) {
                    return relation(values, value);
                });
            });
        }, basis);
    });
};

/** */
QUTIL.map = function (values) {
    return QUTIL.reduce(values, function (values, value) {
        return values.concat([value]);
    }, []);
};

/** */
QUTIL.whenMap = function (values, resolved, rejected) {
    return Q.when(QUTIL.map(values), resolved, rejected);
};

/* demo */
if (module === require.main) {
    QUTIL.whenMap([
        1,2,3,Q.when(QUTIL.delay(1000), function () {return 4})
    ], function (values) {
        print(values);
    });
}

