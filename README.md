# kogs
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`kogs` is a utility library for Node.js. It provides a handful of useful functions that I've found myself re-implementing in multiple projects.

The original design behind `kogs` was to provide a monorepo of small modules that could be used independently. I've since abandoned this in favor of a single module that provides the functionality all in one place.

`kogs` is designed to be as lightweight as possible, with minimal dependencies, as well as being tree-shakeable, so only the functions you use will be included in your final bundle.

# Installation

```
npm install kogs
```

# General Utility Functions

#### `streamToArray(stream: ReadableStream): Promise<Array>`
Consumes all data from a readable stream and returns it as an array.

If the stream is an object stream, the array will contain objects, otherwise it will contain chunks as `Buffer` instances or strings depending on the encoding.

```js
const stream = obtainReadableStream(); // a, b, c
const data = await streamToArray(stream);

// data => ['a', 'b', 'c']
```
---
#### `streamToBuffer(stream: ReadableStream): Promise<Buffer>`
Consumes all data from a readable stream and returns it as a single `Buffer` instance.

If chunks in the stream are not `Buffer` instances, they will be converted using `Buffer.from()`.

```js
const stream = obtainReadableStream(); // a, b, c
const data = await streamToBuffer(stream);

// data => <Buffer 61 62 63>
```
---
#### `arrayToStream(data: Array, objectMode: boolean): ReadableStream`
Creates a readable stream and writes all data from the provided array to it.

By default `objectMode` will be true if the first item in the array is an object, otherwise it will be false.


```js
const data = ['foo', 'bar', 'baz'];
const stream = arrayToStream(data);

for await (const chunk of stream)
	console.log(chunk);

// > foo
// > bar
// > baz
```
#### `mergeStreams(streams: Array<ReadableStream>): ReadableStream`
Creates a readable stream and merges all data from the provided streams into it.

```js
const streamA = obtainReadableStream(); // a, b, c
const streamB = obtainReadableStream(); // d, e, f

const merged = mergeStreams([streamA, streamB]);
// merged => a, b, c, d, e, f
```

A useful example of this is merging multiple `Gulp` streams into a single stream for uniform processing.

```js
const jsFiles = gulp.src('src/**/*.js').pipe(terser());
const cssFiles = gulp.src('src/**/*.css').pipe(sass());

mergeStreams([jsFiles, cssFiles]).pipe(gulp.dest('dist'));
```
#### `filterStream(stream: ReadableStream, filter: (chunk: any) => boolean): ReadableStream`
Creates a transform stream that filters out all chunks that do not pass the provided filter function.

```js
const stream = obtainReadableStream(); // a, b, c, d, e, f
const filtered = filterStream(stream, chunk => chunk !== 'c');

// filtered => a, b, d, e, f
```

#### `formatDate(format: string, date: Date|number): string`
Formats a date using a provided format string, similar to the [php `date()` function](https://www.php.net/manual/en/function.date.php) The format string can contain any of the following tokens:

| Format | Description |
| --- | --- |
| d | Day of the month (01-31) (2 digits) |
| D | Day of the week (Mon-Sun) (3 letters) | 
| j | Day of the month (1-31) (1 or 2 digits) | 
| l | Day of the week (Monday-Sunday) (full name) |
| N | ISO-8601 numeric representation of the day of the week (1-7) | 
| S | English ordinal suffix for the day of the month (2 characters) | 
| w | Numeric representation of the day of the week (0-6) | 
| z | The day of the year (0-365) | 
| F | Month (January-December) (full name) | 
| m | Numeric representation of a month (01-12) (2 digits) | 
| M | Month (Jan-Dec) (3 letters) | 
| n | Numeric representation of a month (1-12) (1 or 2 digits) |
| t | Number of days in the given month (28-31) | 
| L | Whether it's a leap year (1 or 0) | 
| Y | A full numeric representation of a year (4 digits) | 
| y | A two digit representation of a year (2 digits) | 
| a | Lowercase Ante meridiem and Post meridiem (am or pm) | 
| A | Uppercase Ante meridiem and Post meridiem (AM or PM) | 
| g | 12-hour format of an hour (1-12) (1 or 2 digits) | 
| G | 24-hour format of an hour (0-23) (1 or 2 digits) | 
| h | 12-hour format of an hour (01-12) (2 digits) |
| H | 24-hour format of an hour (00-23) (2 digits) | 
| i | Minutes with leading zeros (00-59) (2 digits) | 
| s | Seconds with leading zeros (00-59) (2 digits) |

Below is an example of formatting a date using the `Y-m-d H:i:s` format.
```js
import { formatDate } from 'kogs';

const date = new Date(2020, 0, 1, 12, 0, 0);
const formatted = formatDate('Y-m-d H:i:s', date);

// formatted => 2020-01-01 12:00:00
```

Characters can be escaped using a backslash.

```js
const date = new Date(2020, 0, 1, 12, 0, 0);
const formatted = formatDate('Y-m-d \\H:\\i:\\s', date);

// formatted => 2020-01-01 H:i:s
```
Additionally, if the `date` parameter is a number, it will be treated as a UNIX timestamp. If you pass a string instead, it will be parsed using `Date.parse()`.

```js
const formatted = formatDate('Y-m-d H:i:s', 1577836800);
// formatted => 2020-01-01 00:00:00

const formatted = formatDate('Y-m-d H:i:s', '2019-01-01 00:00:00');
// formatted => 2019-01-01 00:00:00
```

# Unit Testing

#### `test.run(fn: () => any, name?: string): Promise<void>`
Runs a unit test, contained inside a function (which can be asynchronous). If the function throws an error, the test will fail.

If `name` is not provided, the function constructor name will be used instead. If that is not available, the test will be named `Test #n` where `n` is the number of tests that have been run.

Tests are run asynchronously, so you can run multiple tests in parallel. See `test.results()` for a summary of all tests that have been run.

```js
await test.run(async () => {
	// Test code here.
}, 'My Unit Test');
 
// > [✓] My Unit Test passed after 1ms.

await test.run(function myFunction() {
	// Test code here.
});

// > [✓] myFunction passed after 1ms.

await test.run(() => {
	// Test code here.
});

// > [✓] Test #3 passed after 1ms.

await test.run(() => {
	throw new Error('Test failed!');
}, 'Errorenous Test');

// > [x] Errorenous Test failed after 1ms.
```
---
#### `test.results(): Promise<void>`

Prints a summary of all tests that have been run, including the number of tests that passed and failed.

The function returns a `Promise` which resolves when all tests initiated with `test.run()` have completed.

```js
await test.run(() => {
	// Test code here.
});

await test.results();
```
---
#### `test.capture(fn: () => any): Promise<{ stdout: string[], stderr: string[] }>`

Captures all output to `process.stdout` and `process.stderr` while a `Promise` is resolving. The function can be asynchronous.

Once the provided `Promise` has resolved, the captured output will be returned as an object with `stdout` and `stderr` properties, each an array of strings.

```js
const output = await test.capture(async () => {
	console.log('foo');
	console.error('bar');
});

// output => { stdout: ['foo'], stderr: ['bar'] }
```
# Markdown
The `renderMarkdown()` function exported by `kogs` can take data in various formats and produce a string containing Markdown-formatted table.

> Array: If you provide a single-dimensional array, it will be treated as a single row of data. If you provide a two-dimensional array, each sub-array will be treated as an individual row of data.

> Object: If you provide an object, you should set the `data` property to an array of data. This document outlines other properties you can provide to customize the output.
```js
import { renderMarkdown } from 'kogs';

const md = renderMarkdown(
	[
		['Thor', 'Ironman', 'Loki'],
		['Blackwidow', 'Hulk', 'Hawkeye']
	]
);

// | Column 1   | Column 2 | Column 3 |
// | ---------- | -------- | -------- |
// | Thor       | Ironman  | Loki     |
// | Blackwidow | Hulk     | Hawkeye  |
```

**Custom Headers**

By default, headers will be automatically generated for the table. If you want to specify your own headers, you can do so by passing an array of strings as `options.headers`.

> Note: If you don't provide enough headers to cover all columns, the remaining headers will be automatically generated.

> Note: If you provide more headers than columns, the additionally provided headers will be included and rows will be padded with empty cells.
```js
const md = renderMarkdown({
	headers: ['Header A', 'Header B', 'Header C'],
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	]
});

// | Header A | Header B | Header C |
// | -------- | -------- | -------- |
// | Harry    | Ron      | Ginny    |
// | Luna     | Hagrid   | Dobby    |
```

**Custom Header Prefix**

If you don't want to specify your own headers, but you want to customize the prefix used to generate the headers, you can do so by passing a string as `options.headerPrefix`.

```js
const md = renderMarkdown({
	headerPrefix: 'Foo ',
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	]
});

// | Foo 1 | Foo 2  | Foo 3 |
// | ----- | -----  | ----- |
// | Harry | Ron    | Ginny |
// | Luna  | Hagrid | Dobby |
```

**Minimal Output**

By default, the markdown output is formatted with padding to create human readable tables. If you want to output the table with minimal formatting, you can do so by passing `options.minimal` as `true`.

```js
const md = renderMarkdown({
	minimalOutput: true,
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	]
});

// |Column 1|Column 2|Column 3|
// |---|---|---|
// |Harry|Ron|Ginny|
// |Luna|Hagrid|Dobby|
```

**Content Alignment**

To align the content of fields, you can provide `options.alignment` which can be a string (`left`, `center`, or `right`) or an array of strings. If you provide a string, it will be applied to all columns. If you provide an array, each string will be applied to the corresponding column.

> Note: Only the first letter is used to determine the alignment, allowing for a short-hand syntax of `l`, `c`, or `r`.

```js
const md = renderMarkdown({
	alignment: ['l', 'c', 'r'],
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	];
});

// | Column 1 | Column 2 | Column 3 |
// | :------- | :------: | -------: |
// | Harry    |  Ron     | Ginny    |
// | Luna     |  Hagrid  | Dobby    |
```

**Miscellaneous Options**
```js
{
	// The character(s) to use to separate rows.
	lineSeparator: '\r\n',
}
```

# Logging
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
**User Prompt**
```js
// Prompt the user for input.
const input = await log.prompt('Enter a value: ');
```
**Miscellanous**
```js
log.setPrefix('[Fudge] '); // Set a prefix.
log.write('Hello!');
// > [Fudge] Hello!

log.setPrefix(); // Reset to no prefix.
log.write('Hello!');
// > Hello!
```

# Legal
All modules in this repository are licensed under the MIT license. See [LICENSE](LICENSE) for more information.

All code in this repository is provided as-is, without warranty of any kind. I am not responsible for any damage caused by the use of this code.