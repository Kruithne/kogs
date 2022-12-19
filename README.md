# kogs
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`kogs` is a utility library for Node.js. It provides a handful of useful functions that I've found myself re-implementing in multiple projects.

The original design behind `kogs` was to provide a monorepo of small modules that could be used independently. I've since abandoned this in favor of a single module that provides all of the functionality.

`kogs` is designed to be as lightweight as possible, with no dependencies. It is designed to be tree-shaken, so only the functions you use will be included in your final bundle.

## Installation

```
npm install kogs
```

## Usage

#### `streamToArray(stream: ReadableStream): Promise<Array>`
Consumes all data from a readable stream and returns it as an array.

If the stream is an object stream, the array will contain objects, otherwise it will contain chunks as `Buffer` instances or strings depending on the encoding.

```js
const stream = obtainReadableStream(); // a, b, c
const data = await streamToArray(stream);

// data => ['a', 'b', 'c']
```

#### `streamToBuffer(stream: ReadableStream): Promise<Buffer>`
Consumes all data from a readable stream and returns it as a single `Buffer` instance.

If chunks in the stream are not `Buffer` instances, they will be converted using `Buffer.from()`.

```js
const stream = obtainReadableStream(); // a, b, c
const data = await streamToBuffer(stream);

// data => <Buffer 61 62 63>
```

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

## Legal
All modules in this repository are licensed under the MIT license. See [LICENSE](LICENSE) for more information.

All code in this repository is provided as-is, without warranty of any kind. I am not responsible for any damage caused by the use of this code.