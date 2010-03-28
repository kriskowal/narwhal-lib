
var ENGINE = require("engine");

/**
 * Prints a deprecation warning to standard output, with
 * terminal colors if possible.
 * @param {String} warning
 */
exports.deprecated = function(warning) {
    if (ENGINE.strict)
        throw new Error("Deprecated: " +  warning);
    try {
        require("narwhal/term")
            .stream
            .printError("\0yellow(Deprecated: " + warning + "\0)");
    } catch (exception) {
        require("system").print("Deprecated: " + warning);
        throw exception;
    }
}

