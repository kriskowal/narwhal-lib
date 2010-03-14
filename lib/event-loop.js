var engine = require("event-loop-engine");
exports.enqueue = engine.enqueue;
exports.setTimeout = engine.setTimeout;
exports.setInterval = engine.setInterval;
exports.clearTimeout = engine.clearTimeout;
exports.clearInterval = engine.clearInterval;
exports.hasPendingEvents = engine.hasPendingEvents;
exports.processNextEvent = engine.processNextEvent;
// this needs to be removed and hook into the unload event
exports.enterEventLoop = engine.enterEventLoop;