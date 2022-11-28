# @kogs/argv
[![License: MIT](https://img.shields.io/github/license/kruithne/kogs?style=flat-square)](https://github.com/Kruithne/kogs/blob/main/LICENSE)

`@kogs/argv` parses command line arguments. Instead of trying to cover the infinite number of ways that arguments can be passed and parsed, this library does so in an opinionated way that is designed to be simple and efficient.

# Installation
```
npm install @kogs/argv
```

# Usage

**Basic Usage**
```js
import argv from '@kogs/argv';

// By default, process.argv is used as the source.
// Example: node index.js test --foo=bar -abc baz --baz fudge bar
// Note that the executable and script path are ignored when using process.argv.

const args = argv.parse();

// Result:
args = {
	0: 'test',
	1: 'bar',
	foo: 'bar',
	baz: 'fudge',
	a: true,
	b: true,
	c: 'baz'
};
```
# Short Options

Short options are single-character options prefixed with a `-` and can combined into groups. For example, `-abc` is equivalent to `-a -b -c`. Without a value, the option is treated as a boolean flag.

```js
argv.parse(['-abc']);
// > { a: true, b: true, c: true }
```
If a positional argument is encountered after a short option, it will be assigned to that short option.

```js
argv.parse(['-a', 'foo']);
// > { a: 'foo' }
```
If a positional argument is encountered after a short option group, it will be assigned to the last short option in the group.

```js
argv.parse(['-abc', 'foo']);
// > { a: true, b: true, c: 'foo' }
```

Unlike long options, short options do not support `=` assignment.
```js
argv.parse(['-a=foo']);
// > Error: Invalid character {=} in flag group {-a=foo}
```
Short options must be a single a-z, A-Z character; anything else will throw an error.
```js
argv.parse(['-1']);
// > Error: Invalid character {1} in flag group {-1}
```

# Long Options

Long options are multicharacter options which are prefixed with `--`. Without a value, the option is treated as a boolean flag.
```js
argv.parse(['--foo']);
// > { foo: true }
```
Long options can be assigned a value using `=`.
```js
argv.parse(['--foo=bar']);
// > { foo: 'bar' }
```
If a positional argument is encountered after a long option, it will be assigned to that long option.

```js
argv.parse(['--foo', 'bar']);
// > { foo: 'bar' }
```
# Positional Arguments

Positional arguments are arguments which are not prefixed with `-` or `--` that haven't been consumed as values by long or short options (as demonstrated in the previous sections).

Positional arguments are assigned an incremental index starting from `0`, indicating their position in the argument list (relative to other positional arguments).
```js
argv.parse(['foo',, '--foo=bar', 'bar']);
// > { 0: 'foo', 1: 'bar', 'foo': 'bar' }
```
Positional arguments are also assigned to the hidden `_` property, which is an array of all positional arguments. This can be used to easily access all positional arguments without having to know their index.
```js
argv.parse(['file-a.txt', 'file-b.txt', 'file-c.txt']);
// > { 0: 'file-a.txt', 1: 'file-b.txt', 2: 'file-c.txt' }

for (const file of args._)
	console.log(file);

// > file-a.txt
// > file-b.txt
// > file-c.txt
```
Note: [This property is not enumerable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties), so it will not be included in `Object.keys()` or `Object.entries()`.