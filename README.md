# kogs
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`kogs` is a utility library for Node.js. It provides a handful of useful functions that I've found myself re-implementing in multiple projects.

The original design behind `kogs` was to provide a monorepo of small modules that could be used independently. I've since abandoned this in favor of a single module that provides the functionality all in one place.

`kogs` is designed to be as lightweight as possible, with no dependencies, as well as being tree-shakeable, so only the functions you use will be included in your final bundle.

## Installation

```
npm install kogs
```

## Usage
### General Utility Functions

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

---
### Unit Testing

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
---


## Legal
All modules in this repository are licensed under the MIT license. See [LICENSE](LICENSE) for more information.

All code in this repository is provided as-is, without warranty of any kind. I am not responsible for any damage caused by the use of this code.