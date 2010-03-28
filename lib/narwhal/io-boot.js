
/**
 * Provides building blocks for byte and character IO streams.
 * @module
 */
var BUFFER = require("./buffer");
var Buffer = BUFFER.Buffer;

/**
 * Common traits of input streams.
 */
var Reader = exports.Reader = function () {};

/***
 * pumps data from this source input stream to the target output
 * stream.
 * @generic
 */
Reader.prototype.copy = function (target) {
    while (true) {
        var buffer = this.read(null);
        if (!buffer.length)
            break;
        target.write(buffer);
    }
    target.flush();
    return this;
};

/***
 */
Reader.prototype.read = function (max) {
    if (max === null)
        return this.readBlock();
    else if (max === undefined)
        return this.readAll();
    else
        return this.readMax(max);
};

/***
 */
Reader.prototype.readBlock = function () {
    return this.readMax();
};

/***
 */
Reader.prototype.readAll = function () {
    var buffer = new Buffer(1024);
    var pos = 0;
    while (true) {
        if (pos === buffer.length) {
            var temp = new Buffer(buffer.length * 2);
            buffer.copy(temp);
            buffer = temp;
        }
        var length = this.readInto(buffer, pos);
        pos += length;
        if (!length)
            break;
    }
    return buffer.range(0, pos);
};


/***
 */
var Writer = exports.Writer = function () {};


/**
 * Unifies an input and an output stream into a single API.
 * @param input
 * @param output
 */
var IO = exports.IO = function (input, output) {
    this.input = input;
    this.output = output;
};

/*** */
IO.prototype.read = function () {
    return this.input.read.apply(this.input, arguments);
};

/*** */
IO.prototype.readInto = function (buffer, start, stop) {
    return this.input.readInto(buffer, start, stop);
};

/*** */
IO.prototype.writeFrom = function (buffer, start, stop) {
    return this.output.writeFrom(buffer, start, stop);
};

/*** */
IO.prototype.flush = function () {
    this.output.flush();
    return this;
};

/*** */
IO.prototype.close = function () {
    if (this.input)
        this.input.close();
    if (this.output)
        this.output.close();
};

/*** */
IO.prototype.copy = Reader.prototype.copy;


/**
 */

var TextReader = exports.TextReader = function (raw) {
    var self = Object.create(TextWriter.prototype);

    /***
     */
    self.raw = raw;

    return Object.create(self);
};

TextReader.prototype = Object.create(Reader.prototype);

TextReader.prototype.constructor = TextReader;

/***
 * @generic
 */
TextReader.prototype.readLines = function () {
    var lines = [];
    do {
        var line = this.readLine();
        if (line.length)
            lines.push(line);
    } while (line.length);
    return lines;
};

/***
 * @generic
 */
TextReader.prototype.next = function () {
    return this.readLine().replace(/\n$/, '');
};

/***
 * @generic
 */
TextReader.prototype.iterator = function () {
    return this;
};

/***
 * @generic
 */
TextReader.prototype.forEach = function (block, that) {
    var line;
    while (true) {
        try {
            line = this.next();
        } catch (exception) {
            if (exception === StopIteration)
                break;
            throw exception;
        }
        block.call(that, line);
    }
};

/**
 */
var TextWriter = exports.TextWriter = function (raw, charset) {
    var self = Object.create(TextWriter.prototype);

    /***
     */
    self.raw = raw;

    /***
     */
    self.charset = charset;

    /***
     */
    self.recordSeparator = "\n";

    /***
     */
    self.fieldSeparator = " ";

    // bind print because it, in particular, often
    // gets called as a non-method
    self.print = self.print.bind(self);

    return Object.create(self);
};

/***
 */
TextWriter.prototype.write = function (string) {
    this.raw.write(Buffer.fromString(string, this.charset));
    return this;
};

/***
 */
TextWriter.prototype.flush = function () {
    this.raw.flush();
    return this;
};

/***
 * @generic
 */
TextWriter.prototype.writeLine = function (line) {
    return this.write(string + "\n");
};

/***
 * @generic
 */
TextWriter.prototype.writeLines = function (lines) {
    lines.forEach(this.writeLine, this);
    return this;
};

/***
 * @generic
 */
TextWriter.prototype.print = function () {
    this.write(
        Array.prototype.join.call(arguments, this.fieldSeparator) +
        this.recordSeparator
    );
    this.flush();
    return this;
};


/**
 * unifies a text input and output stream into a single API.
 * @extends IO
 * @extends TextReader
 * @extends TextWriter
 */
var TextIO = exports.TextIO = function (input, output) {
    this.input = input;
    this.output = output;
};

/***
 */
TextIO.prototype.read = IO.prototype.read;

/***
 */
TextIO.prototype.readInto = IO.prototype.readInto;

/***
 */
TextIO.prototype.writeFrom = IO.prototype.writeFrom;

/***
 */
TextIO.prototype.flush = IO.prototype.flush;

/***
 */
TextIO.prototype.close = IO.prototype.close;

/***
 */
TextIO.prototype.readLines = TextWriter.prototype.readLines;

/***
 */
TextIO.prototype.next = TextWriter.prototype.next;

/***
 */
TextIO.prototype.iterator = TextWriter.prototype.iterator;

/***
 */
TextIO.prototype.forEach = TextWriter.prototype.forEach;

/***
 */
TextIO.prototype.writeLine = TextWriter.prototype.writeLine;

/***
 */
TextIO.prototype.writeLines = TextWriter.prototype.writeLines;

/***
 */
TextIO.prototype.print = TextWriter.prototype.print;


/**
 * Wraps a raw byte stream with the appropriate text stream
 * for the given mode.
 *
 * @param {ByteStream} raw
 * @param {{read, write, update, append}} mode
 * @param {String} charset
 */
exports.TextIOForMode = function (raw, mode, charset) {
    if (charset === undefined)
        throw new Error("TextStream character set must be specified.");
    if (mode.update) {
        throw new TextIO(
            ENCODINGS.EncoderWriter(raw, charset),
            ENCODINGS.DecoderReader(raw, charset)
        );
    } else if (mode.write || mode.append) {
        return ENCODINGS.EncoderWriter(raw, charset);
    } else if (mode.read) {
        return ENCODINGS.DecoderReader(raw, charset);
    } else {
        throw new Error("file must be opened for read, write, or append mode.");
    }
};

// require last to resolve cyclic dependency
var ENCODINGS = require("./encodings");

