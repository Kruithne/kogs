# @kogs/test
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`@kogs/test` is a mini testing utility that aims to provide a simple interface for running tests.

For small projects, I've often found myself reaching for the benefits of basic unit testing. Instead of bringing in a large tool to achieve this simple goal, this module aims to provide the bare-bones for running tests which is more often enough.

# Installation
```
npm install --save-dev @kogs/test
```
# Usage
**Test Running**
```js
import { test, results } from 'kru-node-test';
import assert from 'node:assert/strict';

test(() => {
	// Do some testing here. If this function
	// throws an error, the test is considered
	// a failure, otherwise a success.

	// Use node:assert to validate data.
	const apple = { color: 'green' };
	assert.ok(apple.color === 'red', 'Apple was not green');
});

test(async () => {
	// Async functions work as tests too.
});

test(function myTestName() => {
	// Functions can be named, otherwise they will
	// be assigned an incremental index.
});

// Tests can also be named by the second parameter.
test(myFunction, 'Test Name');

results(); // Prints testing results.

// By default tests are run asynchronously.
// To run tests in series, await test().
(async () => {
	// These tests will be run in series.
	await test(myFirstTest);
	await test(mySecondTest);
})();

// If you want to run multiple batches of tests, you'll want to
// wait for results() to resolve before starting the next batch.
(async () => {
	test(() => {}); // Test #1
	test(() => {}); // Test #2

	await results();

	test(() => {}); // Test #1
});
```
**STD Capture**

In some instances of testing, it may be useful to capture the terminal output to validate it. This can be achieved by using the `capture` function.

> Note: It is important to consider escape sequences, such as line-breaks or color codes, when validating terminal output.

```js
import { capture } from 'kru-node-test';

const output = capture(() => {
	console.log('Hello World!');
	console.error('This is your captain speaking.');
});

const { stdout, stderr } = output;

assert.ok(stdout[0] === 'Hello World!\n');
assert.ok(stderr[1] === 'This is your captain speaking.\n');
```
The `capture()` utility function supports both synchronous and asynchronous functions. It also provides the `stdout` and `stderr` arrays to the internal function.
```js
capture(async (stdout, stderr) => {
	console.log('Hello World!');
	assert.ok(stdout.shift() === 'Hello World!\n');

	await someSlowFunction();
	console.log('This is your captain speaking.');
	assert.ok(stdout.shift() === 'This is your captain speaking.\n');
});
```