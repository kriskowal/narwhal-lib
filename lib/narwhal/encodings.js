
/**
 * Provides character set encoders, decoders, and transcoders.
 * @module
 */

var BUFFER = require("./buffer");
var ENGINE = require("narwhal/iconv-embedding");
var IO = require("./io-boot");
var Buffer = BUFFER.Buffer;
var Transcoder = ENGINE.Transcoder;

/**
 * An object that maintains the state for streaming bytes
 * encoded in a source character set to a target character
 * set, providing a {@link transcode} method for transcoding
 * chunks of data from a source buffer to a target buffer.
 * @param {String} source charset
 * @param {String} target charset
 * @constructor
 */
exports.Transcoder = Transcoder;

/***
 * @name transcode
 * @param {Buffer} source
 * @param {Buffer} target
 * @param {Number} sourceStart optional (0)
 * @param {Number} sourceStop optional (source.length)
 * @param {Number} targetStart optional (0)
 * @param {Number} targetStop optional (target.length)
 * @returns {{source, target, error}} state
 */
// implemented in ./encodings-engine

/**
 * An input stream decorator that transforms a byte stream
 * into a character stream with the given character set.
 *
 * - reads bytes
 * - returns character
 *
 * @param {ByteReader} raw
 * @param {String} charset
 * @param {Number} length optional buffer length
 * @constructor
 */
exports.DecoderReader = function (raw, charset, length) {
    var self = Object.create(exports.DecoderReader.prototype);
    IO.TextReader.construct(self);
    var transcoder = new Transcoder(charset, "UTF-8");
    var source = new Buffer(length || 1024);
    var target = new Buffer(length || 1024);
    var stop = 0; // end of unused source bytes
    var state = {}; // transcoder state of previous run
    var accumulator = "";

    /*** */
    self.raw = raw;
    /*** */
    self.charset = charset;

    function read(max) {
        max = Math.min(max, length);
        if (state.error) {
            state = {};
            stop = 0;
            throw new Error(state.error);
        }
        // get more bytes
        stop += raw.readInto(source, stop);
        if (stop === 0)
            return undefined;
        state = transcoder.transcode(
            source,
            target,
            0, stop, // source
            0, max // target
        );
        // shift the unused bytes to the beginning
        // of the buffer
        source.range(state.source, stop).copy(source);
        stop = stop - state.source;
        return target.range(0, state.target).toString("UTF-8");
    }

    /*** */
    self.readMax = function (max) {
        if (accumulator.length) {
            max = Math.min(accumulator.length, max);
            var result = accumulator.slice(0, max);
            accumulator = accumulator.slice(max);
            return result;
        }
        while (true) {
            var chunk = read(max);
            if (chunk === undefined)
                return "";
            if (chunk.length)
                return chunk;
        }
    };

    /*** */
    self.readBlock = function () {
        return self.readMax(length);
    };

    /*** */
    self.readAll = function () {
        var chunks = [accumulator];
        accumulator = "";
        while (true) {
            var chunk = read();
            if (chunk === undefined)
                break;
            chunks.push(chunk);
        }
        return chunks.join('');
    };

    /*** */
    self.readLine = function () {
        while (true) {
            var pos = accumulator.indexOf("\n");
            if (pos >= 0) {
                var result = accumulator.slice(0, pos + 1);
                accumulator = accumulator.slice(pos + 1);
                return result;
            }
            var chunk = read();
            if (chunk === undefined) { // EOF
                var result = accumulator;
                accumulator = "";
                return result;
            }
            accumulator += chunk;
        }
        return accumulator;
    };

    /*** */
    self.close = function () {
        raw.close();
    };

    return Object.create(self);
};

exports.DecoderReader.prototype = Object.create(IO.TextReader.prototype);
exports.DecoderReader.prototype.constructor = exports.DecoderReader;

/**
 * - accepts characters
 * - writes bytes
 */
exports.EncoderWriter = function (raw, charset, length) {
    var self = Object.create(exports.EncoderWriter.prototype);
    IO.TextWriter.construct(self, raw, charset);
    var transcoder = new Transcoder("UTF-8", charset);
    var source = new Buffer(length || 1024);
    var target = new Buffer(length || 1024);
    var stop = 0; // end of unused source bytes
    var state = {}; // transcoder state of previous run

    /*** */
    self.write = function (text) {
        if (text.length === 0)
            return 0;
        if (state.error) {
            state = {};
            stop = 0;
            throw new Error(state.error);
        }
        var bytes = Buffer.fromString(text, "UTF-8");
        var at = 0;
        while (at < bytes.length) {
            var length = Math.min(source.length - stop, bytes.length - at);
            bytes.range(at, at + length).copy(source.range(stop, stop + length));
            stop += length;
            at += length;
            state = transcoder.transcode(
                source,
                target,
                0, stop // source
            );
            raw.write(target.range(0, state.target));
            // shift unused bytes to beginning of source
            source.range(state.source, stop).copy(source);
            stop = stop - state.source;
        }
        return this;
    };

    /*** */
    self.flush = function () {
        raw.flush();
        return self;
    };

    /*** */
    self.close = function () {
        raw.close();
        return self;
    };

    return Object.create(self);
};

exports.EncoderWriter.prototype = Object.create(IO.TextWriter.prototype);
exports.EncoderWriter.prototype.constructor = exports.EncoderWriter;

