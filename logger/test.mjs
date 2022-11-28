import test from '@kogs/test';
import assert from 'node:assert/strict';
import log from './index.mjs';
import pc from 'picocolors';

(async () => {
	await test.run(() => {
		test.capture(() => {
			const instance = log.instance();

			assert.notEqual(instance, log, 'instance() should not return global log instance');
			assert.ok(instance instanceof log.constructor, 'instance() should return a new log instance');
		});
	}, 'Instance instantiation');

	await test.run(() => {
		test.capture(() => {
			const instance = log.instance();
			assert.ok(instance.write('test') === instance, 'write() should return the log instance');
			assert.ok(instance.indent() === instance, 'indent() should return the log instance');
			assert.ok(instance.dedent() === instance, 'dedent() should return the log instance');
			assert.ok(instance.setLineTerminator('\n') === instance, 'setLineTerminator() should return the log instance');
			assert.ok(instance.setIndentString('\t') === instance, 'setIndentString() should return the log instance');
			assert.ok(instance.clearIndent() === instance, 'clearIndent() should return the log instance');
			assert.ok(instance.setPrefix() === instance, 'setPrefix() should return the log instance');
			assert.ok(instance.info('test') === instance, 'info() should return the log instance');
			assert.ok(instance.warn('test') === instance, 'warn() should return the log instance');
			assert.ok(instance.error('test') === instance, 'error() should return the log instance');
			assert.ok(instance.success('test') === instance, 'success() should return the log instance');
		});
	}, 'Fluent API test')

	await test.run(() => {
		test.capture((stdout) => {
			log.write('Hello, world!');
			assert.equal(stdout.shift(), 'Hello, world!\n');

			// printf formatting
			log.write('Hello, %s!', 'world');
			assert.equal(stdout.shift(), 'Hello, world!\n');

			// printf formatting with multiple arguments
			log.write('Hello, %s! %s', 'world', 'How are you?');
			assert.equal(stdout.shift(), 'Hello, world! How are you?\n');

			// log.pc should be picocolors
			assert.equal(log.pc, pc, 'log.pc should be picocolors');
		});
	}, 'log.write() basic functionality');

	await test.run(() => {
		test.capture((stdout) => {
			assert.equal(log._prefix, '', 'log._prefix should be empty by default');

			log.write('Test');
			assert.equal(stdout.shift(), 'Test\n', 'log.write() should not prefix by default');

			log.setPrefix('[Prefix] ');
			log.write('Test');
			assert.equal(stdout.shift(), '[Prefix] Test\n', 'log.write() should prefix when log._prefix is set');

			log.setPrefix();
			log.write('Test');
			assert.equal(stdout.shift(), 'Test\n', 'log.setPrefix() should clear log prefix when called with no arguments');
		});
	}, 'Prefix tests');

	await test.run(() => {
		test.capture((stdout) => {
			assert.equal(log._lineTerminator, '\n', 'Default line terminator should be \\n');

			log.setLineTerminator('\r\n');
			assert.equal(log._lineTerminator, '\r\n', 'Line terminator should be \\r\\n');
			log.write('Hello, world!');

			assert.equal(stdout.shift(), 'Hello, world!\r\n');

			const instance = log.instance();
			assert.equal(instance._lineTerminator, '\n', 'Instance should not inherit line terminator');

			log.setLineTerminator('\n');
			instance.setLineTerminator('\r\n');

			assert.equal(log._lineTerminator, '\n', 'Global line terminator should not be overwritten by instance');

		});
	}, 'Line termination tests');

	await test.run(() => {
		test.capture((stdout) => {
			assert.equal(log._indentString, '\t', 'Default indent string should be \\t');
			assert.equal(log._indentLevel, 0, 'Default indent level should be 0');

			let expectedLevel = 1;
			for (let i = 0; i < 5; i++) {
				log.indent();
				assert.equal(log._indentLevel, expectedLevel++, 'Indent level should be ' + expectedLevel + 'but was ' + log._indentLevel);
			}

			expectedLevel = 4;
			for (let i = 0; i < 5; i++) {
				log.dedent();
				assert.equal(log._indentLevel, expectedLevel--, 'Indent level should be ' + expectedLevel + ' but was ' + log._indentLevel);
			}

			log.clearIndent();

			// Basic indentation test
			log.indent();
			log.write('Hello, world!');
			assert.equal(stdout.shift(), '\tHello, world!\n');

			// Second level of indentation.
			log.indent();
			log.write('Hello, world!');
			assert.equal(stdout.shift(), '\t\tHello, world!\n');

			// Dedent back to first level.
			log.dedent();
			log.write('Hello, world!');
			assert.equal(stdout.shift(), '\tHello, world!\n');

			// Indent then clear.
			log.indent();
			log.clearIndent();
			log.write('Hello, world!');
			assert.equal(stdout.shift(), 'Hello, world!\n');

			// Test larger indentation jumps.
			log.indent(3);
			log.write('Hello, world!');
			assert.equal(stdout.shift(), '\t\t\tHello, world!\n');

			log.dedent(2);
			log.write('Hello, world!');
			assert.equal(stdout.shift(), '\tHello, world!\n');

			log.clearIndent();

			// Test custom indent strings.
			log.setIndentString('  ');
			assert.equal(log._indentString, '  ', 'Indent string should be "  "');

			// Test custom indent writing.
			log.indent().write('Hello, world!');
			assert.equal(stdout.shift(), '  Hello, world!\n');

			const instance = log.instance();
			assert.equal(instance._indentString, '\t', 'Instance should not inherit indent string');

			log.setIndentString('\t');
			instance.setIndentString('  ');

			assert.equal(log._indentString, '\t', 'Global indent string should not be overwritten by instance');
		});
	}, 'Indentation tests');

	await test.run(() => {
		test.capture((stdout, stderr) => {
			const instance = log.instance();
			const fn = instance.custom('test', '[?] ', process.stdout);

			assert.equal(typeof fn, 'function', 'custom() should return a function');
			assert.equal(typeof instance['test'], 'function', 'custom() should create a function on the instance');
			assert.equal(instance['test'], fn, 'Returned function should be the same as the instance function');

			instance.test('Hello, world!');
			assert.equal(stdout.shift(), '[?] Hello, world!\n');

			instance.setPrefix('[Prefix] ');
			instance.test('Hello, world!');
			assert.equal(stdout.shift(), '[?] [Prefix] Hello, world!\n');

			instance.setPrefix();

			instance.custom('testB', '[?] ', process.stderr);
			instance.testB('Hello, world!');
			assert.equal(stderr.shift(), '[?] Hello, world!\n');
			assert.equal(stdout.length, 0, 'stdout should be empty');

			// Should not be able to overwrite existing functions.
			assert.throws(() => {
				instance.custom('indent', '[?] ', process.stdout);
			}, 'custom() should throw when trying to overwrite an existing function');

			// Should be able to overwrite existing logging level functions.
			assert.doesNotThrow(() => {
				instance.custom('test', '[!] ', process.stdout);
			}, 'custom() should not throw when trying to overwrite an existing logging level function');

			// Check that the overwritten function works.
			instance.test('Hello, world!');
			assert.equal(stdout.shift(), '[!] Hello, world!\n');
		});
	}, 'Custom logging levels test');

	await test.run(() => {
		test.capture((stdout) => {
			const instance = log.instance();
			instance.custom('test', '[{test}] ', process.stdout, e => e.toUpperCase());

			instance.test('Hello, world!');
			assert.equal(stdout.shift(), '[TEST] Hello, world!\n');

			// Colour decorating
			instance.custom('test', '[{test}] ', process.stdout, log.pc.red);
			instance.test('Hello, {world}!');
			assert.equal(stdout.shift(), '[\u001b[31mtest\x1b[39m] Hello, \u001b[31mworld\x1b[39m!\n');
		});
	}, 'Logging level decoration test');

	await test.run(() => {
		test.capture((stdout, stderr) => {
			const instance = log.instance();

			instance.info('This is an {information} message about %s!', 'something');
			assert.equal(stdout.shift(), '[\x1B[36mi\x1B[39m] This is an \x1B[36minformation\x1B[39m message about something!\n');

			instance.warn('This is a {warning} message about %s!', 'something');
			assert.equal(stderr.shift(), '[\x1B[33m!\x1B[39m] This is a \x1B[33mwarning\x1B[39m message about something!\n');

			instance.error('This is an {error} message about %s!', 'something');
			assert.equal(stderr.shift(), '[\x1B[31mx\x1B[39m] This is an \x1B[31merror\x1B[39m message about something!\n');

			instance.success('This is a {success} message about %s!', 'something');
			assert.equal(stdout.shift(), '[\x1B[32m✓\x1B[39m] This is a \x1B[32msuccess\x1B[39m message about something!\n');
		});
	}, 'Built-in logging levels test');

	await test.results();
})();