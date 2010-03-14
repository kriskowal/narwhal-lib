
// Kris Zyp

/**
 * Represents the event queue for a vat
 * The API is modeled after https://developer.mozilla.org/en/nsIThread
 */

// we could eventually upgrade to PriorityBlockingQueye with FIFOEntry tie breaking
var loopLevel = 0,
    shuttingDown, 
    queue = new java.util.concurrent.LinkedBlockingQueue();
    

exports.getNextEvent = function(){
    return queue.take();
};

exports.processNextEvent = function(mayWait){
    if(!mayWait && queue.isEmpty()){
        return false;
    }
    try{
        var next = queue.take();
        next();
    }catch(e){
        exports.enqueue(function(){
            if(typeof onerror === "function"){
                // trigger the onerror event in the worker if an error occurs
                try{
                    onerror(e);
                }
                catch(e){
                    // don't want an error here to go into an infinite loop!
                    exports.defaultErrorReporter(e);
                }
            }
            else{
                exports.defaultErrorReporter(e);
            }
        });


    }
    return true;
};

exports.enterEventLoop = function(onidle){
    shuttingDown = false;
    loopLevel++;
    var currentLoopLevel = loopLevel;
    while(true){

        if (queue.isEmpty()) {
            // fire onidle events if a callback is provided
            if (onidle) {
                onidle();
            }
            if(shuttingDown){
                return;
            }
        }
        if (loopLevel < currentLoopLevel) {
            return;
        }

        exports.processNextEvent(true);

    }

};

exports.enqueue = function(task, priority){
    if(loopLevel > -1){
        queue.put(task); // priority is ignored for now until PriorityBlockingQueue is used
    }
};

exports.hasPendingEvents = function(){
    return !queue.isEmpty();    
}

// based on Node's process.unloop();
exports.unloop = function(){
    loopLevel--;
};

exports.shutdown = function(){
    shuttingDown = true;
    if(queue.isEmpty()){
        // if it is empty we need to kick start the event loop to make sure we get into the
        // the check for shuttingDown
        exports.enqueue(function(){});
    }
};

exports.defaultErrorReporter = function(e){
    print((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
};


// setTimeout, setInterval, clearTimeout, clearInterval

// This implementation causes all callbacks to run in a single thread (like browsers) 
// but uses a timer thread to queue the timeout callbacks (but not execute them).

exports.setTimeout = function(callback, delay)
{
    return _scheduleTimeout(callback, delay, false);
}

exports.setInterval = function(callback, delay)
{
    return _scheduleTimeout(callback, delay, true);
}

exports.clearTimeout = function(id)
{
    if (timeouts[id]){
        timeouts[id].task.cancel();
        timeouts[id].cancelled = true;
    }
}

exports.clearInterval = exports.clearTimeout;


var nextId = 1,
    timeouts = {},
    timer, 
    queue;

var _scheduleTimeout = function(callback, delay, repeat)
{
    if (typeof callback == "function")
        var func = callback;
    else if (typeof callback == "string")
        var func = new Function(callback);
    else
        return;

    var timeout = {
    };
    var id = nextId++;
    timeouts[id] = timeout;

    timer = timer || new java.util.Timer("JavaScript timer thread", true);
    var task = timeout.task = new java.util.TimerTask({
        run: function(){
            queue.enqueue(function(){
                if(!timeout.cancelled){ // check to make sure it wasn't enqueued and then later cancelled
                    func();
                }
            });
        }
    });
    delay = Math.floor(delay);
    
    if(repeat){
        timer.schedule(task, delay, delay);
    }
    else{
        timer.schedule(task, delay);
    }
    
    return id;
}


