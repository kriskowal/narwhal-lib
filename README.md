
Narwhal Library
===============

A collection of pure CommonJS JavaScript modules.

* CommonJS assertions and unit testing (`assert`, `test`)
* Radix transcoding (`base16`, `base64`)
* Hashing (`crc32`, `md4`, `md5`, `sha`, `sha256`)
* Unicode transcoding (`utf8`)
* UUID generation (`uuid`)
* Logging (`logger`)
* MIME parsing and content negotiation (`mime`)
* HTML escaping and stripping (`html`)
* Utilities, common `Object`, `Array`, and `String` operators, higher order
  functions (`narwhal/util`)
* Command line options and arguments parsing (`narwhal/args`)
* VT100 terminal control and colorized streaming (`narwhal/term`)
* CommonJS module loading (`narwhal/sandbox`, `narwhal/loader*`)
* Package loading, constructs a `require.paths` (`narwhal/packages`)
* Promises and remote reference manipulation (`narwhal/promise`)

`narwhal-lib` is a package subtree of
[`narwhal`](http://github.com/280north/narwhal), which additionally provides
the `js` command and all of the necessary engine-specific accoutrements for
binary data, IO, file system access, and more.

Contributors
------------

* [Tom Robinson](http://tlrobinson.net/)
* [Kris Kowal](http://askawizard.blogspot.com/)
* [George Moschovitis](http://www.gmosx.com/)
* [Kevin Dangoor](http://www.blueskyonmars.com/)
* Hannes Wallnöfer
* Sébastien Pierre
* Irakli Gozalishvili
* [Christoph Dorn](http://www.christophdorn.com/)
* Zach Carter
* Nathan L. Smith
* Jan Varwig
* Mark Porter
* [Isaac Z. Schlueter](http://blog.izs.me/)
* [Kris Zyp](http://www.sitepen.com/blog/author/kzyp/)
* [Nathan Stott](http://nathan.whiteboard-it.com/)
* [Toby Ho](http://tobyho.com)

License
-------

Copyright (c) 2009, 280 North Inc. <[280north.com](http://280north.com/)\>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

