
// -- tlrobinson Tom Robinson
// -- kriskowal Kris Kowal

var IO = require("./narwhal/io");
var FS = require("./narwhal/fs");
var ENCODINGS = require("./narwhal/encodings");

exports.print = function () {
    exports.stdout.write(
        Array.prototype.join.call(arguments, ' ') + "\n"
    ).flush();
};

var locale = exports.env.LOCALE || "UTF-8";

var rawStdin =  IO.openFd(0);
var rawStdout = IO.openFd(1);
var rawStderr = IO.openFd(2);
exports.stdin  = ENCODINGS.DecoderReader(rawStdin, locale);
exports.stdout = ENCODINGS.EncoderWriter(rawStdout, locale);
exports.stderr = ENCODINGS.EncoderWriter(rawStderr, locale);

exports.originalArgs = exports.args.slice();

exports.fs = FS;

// default logger
var Logger = require("./narhwal/logger").Logger;
exports.log = new Logger(exports.stderr);

