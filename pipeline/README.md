# @kogs/pipeline
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`@kogs/pipeline` provides an API for streaming data through a pipeline of functions, applying transformations in series. This module is based on the same concepts and API as `gulp`, implemented in a more simplistic manner.

# Installation
```
npm install @kogs/pipeline
```

# Usage

```js
import { src, dest } from '@kogs/pipeline';
src(...);

// or

import pipeline from '@kogs/pipeline';
pipeline.src(...);
```

Using the same API as `gulp`, `@kogs/pipeline` provides a `src` function for loading files from disk. This function accepts a glob pattern and returns a `ReadableStream` of `FileObject` instances.

```js
const stream = src('src/**/*.js');
```

The `FileObject` has a few properties that are useful for working with files:

```js
{
  path: string,
  data: Buffer,
  stats: fs.Stats
}
```

For efficiency, the `data` property is lazy-loaded and will only be populated when the property is accessed. This allows the `FileObject` to be passed through a pipeline without having to load the file contents into memory.

Since objects may be passed between numerous transformations in a pipeline, setting the `data` property will not update the file on disk. To write the file to disk, use the `dest` function.

The `dest` function is used to write files to disk. This function accepts a path and returns a `ReadableStream` of `FileObject` instances with their `path` updated to reflect the new location.

```js
src('src/**/*.js').pipe(dest('dist'));
```
For simple transformations, it may be easier to use the `transform` function. This function accepts a function that will be called for each file in the stream. This removes the need to create a `TransformStream` for simple transformations such as renaming files.

```js
src('src/**/*.js')
  .pipe(transform(file => {
	file.path = file.path.replace(/\.js$/, '.min.js');
  }))
  .pipe(dest('dist'));
```
> Note: The return value of the transformer function is not used; modify the `FileObject` instance directly.

Additionally, the `transform` function supports asynchronous functions. This allows for more complex transformations that may require asynchronous operations such as reading from a database or making a network request.

```js
src('src/**/*.js')
  .pipe(transform(async file => {
	const data = await fetch('https://example.com/api');
	file.data = Buffer.from(data);
  }))
  .pipe(dest('dist'));
```
To reduce a stream to a sub-set of files, the `filter` function can be used. This function accepts a function that will be called for each file in the stream. If the function returns `true`, the file will be passed through the stream. If the function returns `false`, the file will be dropped from the stream.

```js
src('src/**/*.js')
  .pipe(filter(file => file.path.endsWith('.min.js')))
  .pipe(dest('dist'));
```
When processing files in a pipeline, a common task is to change the extension of a file. To simplify this, the `ext` function can be used. This function accepts a new extension and will update the `path` property of each file in the stream.

```js
src('src/**/*.js')
  .pipe(ext('.min.js'))
  .pipe(dest('dist'));
```
It can sometimes be useful to merge two streams together. To do this, the `merge` function can be used. This function accepts a variable amount of streams and resolves them into a single stream.

```js
const stream1 = src('src/**/*.js').pipe(terser());
const stream2 = src('src/**/*.css').pipe(sass());

const upload = await merge(stream1, stream2).pipe(dest('dist'));
```