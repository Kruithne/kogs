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
Rather than using the default `process.argv` source, you can also pass an array of arguments to parse:
```js
const args = argv.parse(['--foo', 'bar']);
// > args = { foo: 'bar' }
```
Note that unlike `process.argv`, the whole array is parsed, since the executable and script path are not expected to be present.

**Naming Restrictions**

Since short options can be grouped togethr, they are restricted to single-characters in the a-z, A-Z range.

```js
const args = argv.parse(['-abc']);
// > args = { a: true, b: true, c: true }
```

Long options are restricted to the a-z, A-Z, 0-9, and '-' range, with the exception that the first character must be in the a-z, A-Z range.

```js
const args = argv.parse(['--foo-bar']);
// > args = { 'foo-bar': true }

const args = argv.parse(['--1foo']);
// > Error: Invalid long option name {--1foo}
```

**Argument Overwriting**

Something to keep in mind is that if an argument is included multiple times, the last value will overwrite any previous values.

```js
const args = argv.parse(['--foo', 'bar', '--foo', 'baz']);
// > args = { foo: 'baz' }
```
Arguments can overwrite each other even if they are different types. For example, a single-character long option can overwrite a short option.
```js
const args = argv.parse(['-a', '--a', 'foo']);
// > args = { a: 'foo' }
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
An important note is that while `--foo` is treated as a boolean flag, `--foo=true` is not. The value `true` is treated as a string, and will be assigned to the option.
```js
argv.parse(['--foo']);
// > { foo: true }

argv.parse(['--foo=true']);
// > { foo: 'true' }
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

# Manifest
A manifest can be provided to `argv.parse()` to define the expected arguments and provide more control over the parsing process.
```js
const manifest = {
	0: {
		type: 'string',
		description: 'Description of the first positional argument.'
	}

	'foo': {
		type: 'string',
		description: 'Description of the --foo option.'
	}
};

argv.parse(['bar', '--foo', 'baz'], manifest);
// > { foo: 'baz', 0: 'bar' }
```
If a manifest is provided, any arguments (except positional arguments) which are not defined in the manifest will throw an error. This is preferred over ignoring unknown arguments, as it helps to catch typos and other errors.
```js
const manifest = {
	'foo': {
		type: 'string',
		description: 'Description of the --foo option.'
	}
};

argv.parse(['--bar', 'baz'], manifest);
// > Error: Unknown argument {--bar}
```

**Type Casting**

Specifying the `type` property in the manifest allows you to cast the provided value for an option. The following types are supported: `string`, `int`, `float`, `boolean`. Arrays are also supported (see below).

> Note: If you do not specify a type, the value will be either a string or boolean depending on how the user provided the argument. To ensure you always get the expected type, you should implicitly specify it.
```js
const manifest = {
	'foo': {
		type: 'int'
	}
};

argv.parse(['--foo', '123'], manifest);
// > { foo: 123 }
```
In the event that a value cannot be cast to the specified type, an error will be thrown.
```js
argv.parse(['--foo', 'bar'], manifest);
// > Error: Invalid value {bar} for option {--foo=<int>}
```
Specifying `boolean` as the type will cause the option to be treated as a flag. If a positional argument follows the flag, it will not be consumed as the value like it normally would.
```js
const manifest = {
	'foo': {
		type: 'boolean'
	},

	0: {
		type: 'string'
	}
};

argv.parse(['--foo', 'bar'], manifest);
// > { foo: true }
```
As mentioned in the **Long Options** section, specifying truthful values for boolean flags is not supported. `--foo=true` will be treated as a string. If the type is set to `boolean`, an error will be thrown.
```js
const manifest = {
	'foo': {
		type: 'boolean'
	}
};

argv.parse(['--foo=true'], manifest);
// > Error: Invalid value {true} for option {--foo=<boolean>}
```

**Allowed Values**

For options which have a limited set of allowed values, you can specify the `allow` property as an array. If the provided value is not in the array, an error will be thrown.
```js
const manifest = {
	'foo': {
		type: 'string',
		allow: ['bar', 'baz']
	}
};

argv.parse(['--foo', 'bar'], manifest);
// > { foo: 'bar' }

argv.parse(['--foo', 'qux'], manifest);
// > Error: Invalid value {qux} for option {--foo=<bar|baz>}
```