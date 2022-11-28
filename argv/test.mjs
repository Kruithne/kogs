import test from '@kogs/test';
import assert from 'node:assert/strict';
import argv from './index.mjs';

(async () => {
	await test.run(() => {
		assert.deepEqual(argv.parse([]), {}, 'argv.parse() should return an empty object when no arguments are provided');
		assert.throws(() => argv.parse('not an array'), 'argv.parse() should throw an error when the first argument is not an array');

		assert.deepEqual(argv.parse(['--include-condiment=mayo']), { 'include-condiment': 'mayo' }, 'argv.parse() should parse long options with affixed values');
		assert.deepEqual(argv.parse(['--include-condiment']), { 'include-condiment': true }, 'argv.parse() should parse long options without values');
		assert.deepEqual(argv.parse(['--include-condiment', 'mayo']), { 'include-condiment': 'mayo' }, 'argv.parse() should parse long options without values, but with the next argument as the value');
		assert.deepEqual(argv.parse(['-a', '-b', '-c']), { a: true, b: true, c: true }, 'argv.parse() should parse short options');
		assert.deepEqual(argv.parse(['-abc']), { a: true, b: true, c: true }, 'argv.parse() should parse short option groups');
		assert.throws(() => argv.parse(['-abc2']), 'argv.parse() should throw an error when a short option group contains an invalid character');
		assert.deepEqual(argv.parse(['-abc', 'mayo']), { a: true, b: true, c: 'mayo' }, 'argv.parse() should parse next argument as the value of the last short option in a group');
		assert.deepEqual(argv.parse(['test']), { 0: 'test' }, 'argv.parse() should parse loose arguments');
		assert.deepEqual(argv.parse(['-a', 'fudge']), { a: 'fudge' }, 'argv.parse() should parse loose arguments after short options');
		assert.deepEqual(argv.parse(['test', '-a', 'fudge']), { 0: 'test', a: 'fudge' }, 'argv.parse() should parse loose arguments before short options');
		assert.deepEqual(argv.parse(['--include-condiment=mayo', 'test', '-a', 'fudge']), { 'include-condiment': 'mayo', 0: 'test', a: 'fudge' }, 'argv.parse() should parse loose arguments before and after short options and long options');
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
		const args = argv.parse(['--apple', 'orange', '-a', 'pear', 'plum', 'peach']);
		assert.deepEqual(args, { apple: 'orange', a: 'pear', 0: 'plum', 1: 'peach' }, 'argv.parse() should parse the provided arguments');
		assert.deepEqual(args._, ['plum', 'peach'], 'argv.parse() should add a _ property to the returned object containing the loose arguments');
	}, 'test arv.parse() loose argument array');

	await test.run(() => {
		assert.throws(() => argv.parse(['--_']), 'argv.parse() should throw an error when a long option is an underscore');
	}, 'test argv.parse() reserved option names');

	await test.results();
})();