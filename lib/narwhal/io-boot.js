
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
 * routes `read` calls to `readAll`, `readBlock`, or
 * `readMax(n)` depending on whether the argument is
 * `undefined`, `null`, or a `Number` respectively.
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
 * as a default implementation, calls `readMax` with no
 * argument.  This is intended to be overriden or replaced
 * if block size information is available.
 */
Reader.prototype.readBlock = function () {
    return this.readMax();
};

/***
 * @returns {Buffer} the entirety of the remaining input.
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
 * pumps data from this source input stream to the target output
 * stream.
 * @this {{read(null)}} any object that supports reading
 * blocks.
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
 * @returns {Buffer} the next chunk of input (from
 * `read(null)`, or @throws `StopIteration` if the next
 * chunk is empty.
 */
Reader.prototype.next = function () {
    var chunk = this.read(null);
    if (!chunk.length)
        throw StopIteration;
    return chunk;
};

/***
 * A suitable implementation of `iterator` for any type that
 * is itself an iterator, not merely iterable.
 * @returns this
 * @this {Object}
 */
Reader.prototype.iterator = function () {
    return this;
};

/***
 * @this {{iterator}} any iterable object.  `iterator` must
 * return an object with a `next` method that returns the
 * next element of the iteration or throws `StopIteration`.
 */
Reader.prototype.forEach = function (block, that) {
    var line;
    var iterator = this.iterator();
    while (true) {
        try {
            line = iterator.next();
        } catch (exception) {
            if (exception === StopIteration)
                break;
            throw exception;
        }
        block.call(that, line);
    }
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
IO.prototype.read = function (max) {
    return this.input.read(max);
};

/*** */
IO.prototype.readMax = function (max) {
    return this.input.readMax(max);
};

/*** */
IO.prototype.readBlock = function () {
    return this.input.readBlock();
};

/*** */
IO.prototype.readAll = function () {
    return this.input.readAll();
};

/*** */
IO.prototype.readInto = function (buffer, start, stop) {
    return this.input.readInto(buffer, start, stop);
};

/*** */
IO.prototype.write = function (content) {
    return this.output.write(content);
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

/*** */
IO.prototype.next = function () {
    return this.input.next();
};

/*** */
IO.prototype.iterator = Reader.prototype.iterator;

/*** */
IO.prototype.forEach = function () {
    return this.input.forEach.apply(this.input, arguments);
};


/**
 * @extends Reader
 */

var TextReader = exports.TextReader = function (raw, charset) {
    var self = Object.create(TextReader.prototype);

    /***
     */
    self.raw = raw;

    /***
     */
    self.charset = charset;

    return Object.create(self);
};

TextReader.prototype = Object.create(Reader.prototype);
TextReader.prototype.constructor = TextReader;

/***
 * @this {{readLine}} any object implementing `readLine`
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
 * @this {{readLine}} any object implementing `readLine`
 */
TextReader.prototype.next = function () {
    var line = this.readLine();
    if (!line.length)
        throw StopIteration;
    return line.replace(/\n$/, '');
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

TextWriter.prototype = Object.create(Writer.prototype);
TextWriter.prototype.constructor = TextWriter;

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

/**
 */
var BufferIO = exports.BufferIO = function (buffer) {
    var that = Object.create(BufferIO.prototype);
    that.buffer = buffer || new Buffer(1024);
    that.start = 0;
    that.stop = 0;
    return that;
};

/***
 * @name length
 * @property
 */
Object.defineProperty(BufferIO.prototype, "length", {
    "get": function () {
        return this.stop - this.start;
    }
});

/*** */
BufferIO.prototype.read = Reader.prototype.read;

/*** */
BufferIO.prototype.readInto = function (buffer, start, stop) {
    if (start === undefined)
        start = 0;
    if (stop === undefined)
        stop = buffer.length;
    var max = stop - start;
    var length = Math.min(max, this.length);
    this.buffer.copy(buffer, this.start, this.start + length);
    this.start += length;
    this.settle();
    return length;
};

/*** */
BufferIO.prototype.readMax = function (max) {
    max = max === undefined ? 1024 : max;
    var length = Math.min(max, this.length);
    var result = this.buffer.slice(this.start, this.start + length);
    this.start += length;
    this.settle();
    return result;
};

/*** */
BufferIO.prototype.readBlock = Reader.prototype.readBlock;

/*** */
BufferIO.prototype.readAll = function () {
    var result = this.buffer.slice(this.start, this.stop);
    this.start = 0;
    this.stop = 0;
    return result;
};

/*** */
BufferIO.prototype.settle = function () {
    if (this.start > this.buffer.length >>> 1) {
        this.buffer.range(this.start, this.stop).copy(this);
        this.stop -= this.start;
        this.start = 0;
    }
};

/*** */
BufferIO.prototype.copy = Reader.prototype.copy;

/*** */
BufferIO.prototype.next = Reader.prototype.next;

/*** */
BufferIO.prototype.iterator = Reader.prototype.iterator;

/*** */
BufferIO.prototype.forEach = Reader.prototype.forEach;

/*** */
BufferIO.prototype.writeFrom = function (content, start, stop) {
    if (start === undefined)
        start = 0;
    if (stop === undefined)
        stop = content.length;
    content = content.range(start, stop);
    var capacity = this.buffer.length;
    var length = this.length;
    while (length + content.length > capacity) {
        capacity = Math.min(1, capacity) << 1;
    }
    if (capacity !== this.buffer.length) {
        var realloc = new Buffer(capacity);
        this.buffer.range(this.start, this.stop).copy(realloc);
        this.buffer = realloc;
        content.copy(realloc, length);
        this.start = 0;
        this.stop = length + content.length;
    } else {
        content.copy(this.buffer.range(this.stop));
        this.stop += content.length;
    }
};

/*** */
BufferIO.prototype.write = function (content) {
    this.writeFrom(content);
    return this;
};

/*** */
BufferIO.prototype.flush = function () {
    return this;
};

/*** */
BufferIO.prototype.toString = function (encoding) {
    if (arguments.length === 0) {
        return "[object BufferIO " +
            this.length + " of " +
            this.buffer.length +
        "]";
    } else {
        return this.buffer.apply(this.buffer, arguments);
    }
};

/***
 * @extends IO
 */
var StringIO = exports.StringIO = function (content, charset) {
    var that = Object.create(StringIO.prototype);
    if (charset === undefined)
        charset = "UTF-8";
    var raw = new BufferIO();
    var input = new ENCODINGS.DecoderReader(raw, charset);
    var output = new ENCODINGS.EncoderWriter(raw, charset);
    IO.call(that, input, output);
    if (content)
        that.write(content);
    return that;
};

StringIO.prototype = Object.create(IO.prototype);
StringIO.prototype.constructor = StringIO;

// require last to resolve cyclic dependency
var ENCODINGS = require("./encodings");

