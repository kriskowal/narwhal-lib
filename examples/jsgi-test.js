XMLHttpRequest = require("browser/xhr").XMLHttpRequest;
var request = require("jsgi-client").request;
var when = require("promise").when;
var queue = require("event-loop-engine");
when(request({
    method: "GET",
    url: "http://google.com/"
}), function(response) {
    print("Google responded with " + response.body);
    queue.shutdown();  
});  
queue.enterEventLoop();
