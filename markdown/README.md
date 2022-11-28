# Installation
```
npm install @kogs/markdown
```

# Usage
**Basic Usage**

The `markdown()` function exported by `@kogs/markdown` can take data in various formats.

> Array: If you provide a single-dimensional array, it will be treated as a single row of data. If you provide a two-dimensional array, each sub-array will be treated as an individual row of data.

> Object: If you provide an object, you should set the `data` property to an array of data. This document outlines other properties you can provide to customize the output.
```js
import markdown from '@kogs/markdown';

const md = markdown(
	[
		['Thor', 'Ironman', 'Loki'],
		['Blackwidow', 'Hulk', 'Hawkeye']
	]
);

console.log(md);

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
const md = markdown({
	headers: ['Header A', 'Header B', 'Header C'],
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	]
});

console.log(md);

// | Header A | Header B | Header C |
// | -------- | -------- | -------- |
// | Harry    | Ron      | Ginny    |
// | Luna     | Hagrid   | Dobby    |
```

**Custom Header Prefix**

If you don't want to specify your own headers, but you want to customize the prefix used to generate the headers, you can do so by passing a string as `options.headerPrefix`.

```js
const md = markdown({
	headerPrefix: 'Foo ',
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	]
});

console.log(md);

// | Foo 1 | Foo 2  | Foo 3 |
// | ----- | -----  | ----- |
// | Harry | Ron    | Ginny |
// | Luna  | Hagrid | Dobby |
```

**Minimal Output**

By default, the markdown output is formatted with padding to create human readable tables. If you want to output the table with minimal formatting, you can do so by passing `options.minimal` as `true`.

```js
const md = markdown({
	minimalOutput: true,
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	]
});

console.log(md);

// |Column 1|Column 2|Column 3|
// |---|---|---|
// |Harry|Ron|Ginny|
// |Luna|Hagrid|Dobby|
```

**Content Alignment**

To align the content of fields, you can provide `options.alignment` which can be a string (`left`, `center`, or `right`) or an array of strings. If you provide a string, it will be applied to all columns. If you provide an array, each string will be applied to the corresponding column.

> Note: Only the first letter is used to determine the alignment, allowing for a short-hand syntax of `l`, `c`, or `r`.

```js
const md = markdown({
	alignment: ['l', 'c', 'r'],
	data: [
		['Harry', 'Ron', 'Ginny'],
		['Luna', 'Hagrid', 'Dobby']
	];
});

console.log(md);

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