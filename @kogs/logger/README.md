# @kogs/logger
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`@kogs/logger` provides a selection of logging utilities for Node.js applications.

# Installation
```
npm install @kogs/logger
```

# Usage
```js
import log from '@kogs/logger';
```

**Basic Usage**
```js
log.write('Hello, world');
// > Hello, world

// printf style string formatting via util.format
// See: https://nodejs.org/api/util.html#utilformatformat-args

log.write('I have %d barrels of %s', 3, 'apples');
// > I have 3 barrels of apples
```
**Fluent API Method Chaining**
```js
log.write('Before').indent().write('After');
// > Before
// > 	After
```
**Logging Levels / Decorators**
```js
log.info('This is some information');
// stdout > [i] This is some information

log.warn('This is a warning');
// stderr > [!] This is a warning

log.success('This is a successful message');
// stdout > [✓] This is a successful message

log.error('This is an error message');
// stderr > [x] This is an error message

log.custom('foo', '[?] ', process.stderr, (e) => '<' + e + '>');
log.foo('This is a {custom} message');
// stderr > [?] This is a <custom> message

// log.pc is a reference to picocolors for color decorators.
// See: https://github.com/alexeyraspopov/picocolors
log.custom('foo', '[?] ', process.stdout, log.pc.red);
```
**Indentation**
```js
log.indent(); // Add a single layer of indentation
log.indent(2); // Add X levels of indentation
log.dedent(); // Remove a single layer of indentation
log.dedent(2); // Remove X levels of identation
log.clearIndent(); // Remove all levels of indentation
log.setIndentString('\t'); // Sets indentation string (\t by default)
```
**Instanced Usage**
```js
// Unique logging instances can be created which do not inherit or affect other logging instances, including the global one.
const myLogger = log.instance();
myLogger.indent().write('Foo');
log.write('Bar'); // Global logger unaffected.

// >     Foo
// > Bar
```
**Miscellanous**
```js
log.prefix('[Fudge] '); // Set a prefix.
log.write('Hello!');
// > [Fudge] Hello!

log.prefix(); // Reset to no prefix.
log.write('Hello!');
// > Hello!
```