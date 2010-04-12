
var ENGINE = require("./event-loop-setup").getEventLoop();

exports.enqueue = ENGINE.enqueue || function (task) {
    exports.setTimeout(function () {
        // uses a closure to ensure that any additional
        // parameters are laundered
        task();
    }, 0);
};

exports.setTimeout = ENGINE.setTimeout;
exports.clearTimeout = ENGINE.clearTimeout;
exports.setInterval = ENGINE.setInterval;
exports.clearInterval = ENGINE.clearInterval;

// optional
exports.hasPendingEvents = ENGINE.hasPendingEvents;
exports.processNextEvent = ENGINE.processNextEvent;

