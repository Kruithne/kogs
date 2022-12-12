import test from '@kogs/test';
import assert from 'node:assert/strict';
import argv from './index.mjs';

(async () => {
	await test.run(() => {
		assert.deepEqual(argv.parse(), {}, 'argv.parse() should return an empty object when no arguments are provided');
		assert.throws(() => argv.parse(undefined, 'not an array'), 'argv.parse() should throw an error when the args argument is not an array');

		assert.deepEqual(argv.parse(undefined, ['--include-condiment=mayo']), { 'include-condiment': 'mayo' }, 'argv.parse() should parse long options with affixed values');
		assert.deepEqual(argv.parse(undefined, ['--include-condiment']), { 'include-condiment': true }, 'argv.parse() should parse long options without values');
		assert.deepEqual(argv.parse(undefined, ['--include-condiment', 'mayo']), { 'include-condiment': 'mayo' }, 'argv.parse() should parse long options without values, but with the next argument as the value');

		assert.throws(() => argv.parse(undefined, ['--include@condiment=mayo']), 'argv.parse() should throw an error when a long option contains an invalid character');
		assert.throws(() => argv.parse(undefined, ['--1include-condiment=mayo']), 'argv.parse() should throw an error when a long option begins with a number');
		assert.throws(() => argv.parse(undefined, ['--include@condiment']), 'argv.parse() should throw an error when a long option contains an invalid character');
		assert.throws(() => argv.parse(undefined, ['--1include-condiment']), 'argv.parse() should throw an error when a long option begins with a number');

		assert.deepEqual(argv.parse(undefined, ['-a', '-b', '-c']), { a: true, b: true, c: true }, 'argv.parse() should parse short options');
		assert.deepEqual(argv.parse(undefined, ['-abc']), { a: true, b: true, c: true }, 'argv.parse() should parse short option groups');
		assert.throws(() => argv.parse(undefined, ['-abc2']), 'argv.parse() should throw an error when a short option group contains an invalid character');
		assert.deepEqual(argv.parse(undefined, ['-abc', 'mayo']), { a: true, b: true, c: 'mayo' }, 'argv.parse() should parse next argument as the value of the last short option in a group');

		assert.deepEqual(argv.parse(undefined, ['test']), { 0: 'test' }, 'argv.parse() should parse loose arguments');
		assert.deepEqual(argv.parse(undefined, ['-a', 'fudge']), { a: 'fudge' }, 'argv.parse() should parse loose arguments after short options');
		assert.deepEqual(argv.parse(undefined, ['test', '-a', 'fudge']), { 0: 'test', a: 'fudge' }, 'argv.parse() should parse loose arguments before short options');
		assert.deepEqual(argv.parse(undefined, ['--include-condiment=mayo', 'test', '-a', 'fudge']), { 'include-condiment': 'mayo', 0: 'test', a: 'fudge' }, 'argv.parse() should parse loose arguments before and after short options and long options');
	}, 'test argv.parse() basic functionality');

	await test.run(() => {
		const oldArgv = process.argv; // Save the original argv.
		process.argv = ['node', 'test.mjs'];

		assert.deepEqual(argv.parse(), {}, 'argv.parse() should return an empty object when no arguments are provided');

		process.argv.push('--include-condiment=mayo', '-abc', 'foo', 'bar');
		assert.deepEqual(argv.parse(), { 'include-condiment': 'mayo', a: true, b: true, c: 'foo', 0: 'bar' }, 'argv.parse() should parse the process.argv array when no arguments are provided');

		process.argv = oldArgv; // Restore argv.
	}, 'test argv.parse() defaulting to process.argv');

	await test.run(() => {
		const args = argv.parse(undefined, ['--apple', 'orange', '-a', 'pear', 'plum', 'peach']);
		assert.deepEqual(args, { apple: 'orange', a: 'pear', 0: 'plum', 1: 'peach' }, 'argv.parse() should parse the provided arguments');
		assert.deepEqual(args._, ['plum', 'peach'], 'argv.parse() should add a _ property to the returned object containing the loose arguments');
	}, 'test arv.parse() loose argument array');

	await test.run(() => {
		assert.throws(() => argv.parse(undefined, ['--_']), 'argv.parse() should throw an error when a long option is an underscore');
	}, 'test argv.parse() reserved option names');

	await test.run(() => {
		// Test that providing non-object as a manifest entry throws error.
		assert.throws(() => argv.parse({ 'foo': 'bar' }), 'argv.parse() should throw an error when a manifest option is not an object');

		// Test that if opt.type is set, error is thrown if it is not a valid type.
		assert.throws(() => argv.parse({ 'foo': { type: 'bar' } }), 'argv.parse() should throw an error when a manifest option type is not a valid type');

		// Test that if opt.default is set and opt.type is set, error is thrown if they are not the same type.
		assert.throws(() => argv.parse({ 'foo': { type: 'string', default: 1 } }), 'argv.parse() should throw an error when a manifest option default value is not the same type as the option type');


	}, 'test argv.parse() manifest validation checks');

	await test.run(() => {
		// Test that if opt.type is a boolean, proceeding positional arguments are not consumed by long options.
		assert.deepEqual(argv.parse({ 'foo': { type: 'boolean' } }, ['--foo', 'bar']), { foo: true, 0: 'bar' }, 'argv.parse() should not consume proceeding positional arguments when a manifest option type is boolean');

		// Test that if opt.type is a boolean, proceeding positional arguments are not consumed by short options.
		assert.deepEqual(argv.parse({ 'f': { type: 'boolean' } }, ['-f', 'bar']), { f: true, 0: 'bar' }, 'argv.parse() should not consume proceeding positional arguments when a manifest option type is boolean');
	}, 'test argv.parse() manifest boolean consumption test');

	await test.run(() => {
		assert.doesNotThrow(() => argv.parse({
			'foo': {}
		}, ['--foo', 'bar']), 'argv.parse() should not throw an error when a manifest is provided and the option exists in the manifest');

		assert.throws(() => argv.parse({}, ['--foo', 'bar']), 'argv.parse() should throw an error when a manifest is provided and the option does not exist in the manifest');
	}, 'test argv.parse() manifest existence check');

	await test.run(() => {
		// Test string type.
		assert.deepEqual(argv.parse({
			'foo': {
				type: 'string'
			}
		}, ['--foo', 'bar']), { foo: 'bar' }, 'argv.parse() should parse string types in the manifest');

		// Test int type.
		assert.deepEqual(argv.parse({
			'foo': {
				type: 'int'
			}
		}, ['--foo', '1']), { foo: 1 }, 'argv.parse() should parse int types in the manifest');

		// Test int type with floating point value.
		assert.deepEqual(argv.parse({
			'foo': {
				type: 'int'
			}
		}, ['--foo', '1.5']), { foo: 1 }, 'argv.parse() should parse int types in the manifest');

		// Test int type with a non numeric value.
		assert.throws(() => argv.parse({
			'foo': {
				type: 'int'
			}
		}, ['--foo', 'bar']), 'argv.parse() should throw an error when parsing int types in the manifest with a non numeric value');

		// Test float type.
		assert.deepEqual(argv.parse({
			'foo': {
				type: 'float'
			}
		}, ['--foo', '1.5']), { foo: 1.5 }, 'argv.parse() should parse float types in the manifest');

		// Test float type with a non numeric value.
		assert.throws(() => argv.parse({
			'foo': {
				type: 'float'
			}
		}, ['--foo', 'bar']), 'argv.parse() should throw an error when parsing float types in the manifest with a non numeric value');

		// Test type checking with positional arguments.
		assert.throws(() => argv.parse({
			0: {
				type: 'int'
			}
		}, ['fudge']), 'argv.parse() should throw an error when parsing positional arguments with a non numeric value');

		// Test that we throw an exception if opt.type is boolean and we provide a string.
		assert.throws(() => argv.parse({
			'foo': {
				type: 'boolean'
			}
		}, ['--foo=bar']), 'argv.parse() should throw an error when parsing boolean types in the manifest with a string value');

	}, 'test argv.parse() manifest type casting');

	await test.run(() => {
		// Test if no value is provided that the default value is used.
		assert.deepEqual(argv.parse({
			'foo': {
				default: 'bar'
			}
		}, []), { foo: 'bar' }, 'argv.parse() should use the default value in the manifest when no value is provided');

		// Test if a value is provided that the default value is not used.
		assert.deepEqual(argv.parse({
			'foo': {
				default: 'bar'
			}
		}, ['--foo', 'baz']), { foo: 'baz' }, 'argv.parse() should use the provided value in the manifest when a value is provided');

		// Test that opt.default works for positional arguments.
		assert.deepEqual(argv.parse({
			0: {
				default: true
			}
		}, []), { 0: true }, 'argv.parse() should use the provided value in the manifest when a value is provided');
	}, 'test argv.parse() manifest default values');

	await test.run(() => {
		// Test that if a required option is missing, an error is thrown.
		assert.throws(() => argv.parse({
			'foo': {
				required: true
			}
		}, []), 'argv.parse() should throw an error when a required option is missing');

		// Test that if a required option is provided, no error is thrown.
		assert.doesNotThrow(() => argv.parse({
			'foo': {
				required: true
			}
		}, ['--foo', 'bar']), 'argv.parse() should not throw an error when a required option is provided');
	}, 'test argv.parse() manifest required options');

	await test.run(() => {
		// Test that if opt.allow is not an array, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { allow: 'bar' }}), 'argv.parse() should throw an error when opt.allow is not an array');

		// Test that if opt.allow is an empty array, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { allow: [] }}), 'argv.parse() should throw an error when opt.allow is an empty array');

		// Test that if opt.type is a string and opt.allow is not an array of strings, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { type: 'string', allow: [1] }}), 'argv.parse() should throw an error when opt.type is a string and opt.allow is not an array of strings');

		// Test that if opt.type is int and opt.allow is not an array of ints, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { type: 'int', allow: ['bar'] }}), 'argv.parse() should throw an error when opt.type is int and opt.allow is not an array of ints');

		// Test that if opt.type is float and opt.allow is not an array of floats, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { type: 'float', allow: ['bar'] }}), 'argv.parse() should throw an error when opt.type is float and opt.allow is not an array of floats');

		// Test that if opt.type is boolean and opt.allow is set, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { type: 'boolean', allow: ['bar'] }}), 'argv.parse() should throw an error when opt.type is boolean and opt.allow is set');

		// Test that if opt.allow is set and opt.default is not in opt.allow, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { allow: ['bar'], default: 'baz' }}), 'argv.parse() should throw an error when opt.allow is set and opt.default is not in opt.allow');

		// Test that if opt.allow is set and a value is provided that is not in opt.allow, an error is thrown.
		assert.throws(() => argv.parse({ 'foo': { allow: ['bar'] }}, ['--foo', 'baz']), 'argv.parse() should throw an error when opt.allow is set and a value is provided that is not in opt.allow');

		// Test that if opt.allow is set and a value is provided that is in opt.allow, no error is thrown.
		assert.doesNotThrow(() => argv.parse({ 'foo': { allow: ['bar'] }}, ['--foo', 'bar']), 'argv.parse() should not throw an error when opt.allow is set and a value is provided that is in opt.allow');
	}, 'test argv.parse() manifest allow list');

	await test.results();
})();