import { test, streamToArray, streamToBuffer, arrayToStream, renderMarkdown, mergeStreams, filterStream, log, Log, formatDate } from './index.mjs';
import { Readable } from 'node:stream';
import assert from 'node:assert/strict';
import pc from 'picocolors';

await test.run(async () => {
	const input = [1, 2, 3, 4, 5];
	const stream = new Readable({
		objectMode: true,
		read() {
			for (const content of input)
				this.push(content);
			this.push(null);
		}
	});

	const output = await streamToArray(stream);
	assert.deepStrictEqual(output, input, 'streamToArray should return an array of the stream contents');
}, 'test streamToArray functionality');

await test.run(async () => {
	const input = ['foo', 'bar', 'baz'];
	const stream = new Readable({
		read() {
			for (const content of input)
				this.push(content);
			this.push(null);
		}
	});

	const expected = Buffer.from(input.join(''));

	const buffer = await streamToBuffer(stream);
	assert.deepStrictEqual(buffer, expected, 'streamToBuffer should return a buffer of the stream contents');
}, 'test streamToBuffer functionality');

await test.run(async () => {
	const input = [1, 2, 3, 4, 5];
	const stream = await arrayToStream(input, true);
	
	const output = [];
	for await (const chunk of stream)
		output.push(chunk);
		
	assert.deepStrictEqual(output, input, 'arrayToStream should return a stream of the array contents');
}, 'test arrayToStream functionality with objectMode=true');

await test.run(async () => {
	const input = ['foo', 'bar', 'baz', 'qux'];
	const stream = await arrayToStream(input, false);
	
	const buffers = [];
	for await (const chunk of stream)
		buffers.push(chunk);

	const output = Buffer.concat(buffers).toString();
	assert.deepStrictEqual(output, input.join(''), 'arrayToStream should return a stream of the array contents');
}, 'test arrayToStream functionality with objectMode=false');

await test.run(async () => {
	const stream1Contents = ['a', 'b', 'c'];
	const stream2Contents = ['d', 'e', 'f'];

	const stream1 = await arrayToStream(stream1Contents, true);
	const stream2 = await arrayToStream(stream2Contents, true);

	const merged = await mergeStreams(stream1, stream2);
	const mergedContents = await streamToArray(merged);

	assert.deepStrictEqual(mergedContents, [...stream1Contents, ...stream2Contents]);
}, 'test mergeStreams() functionality');

await test.run(async () => {
	const streamContents = ['a', 'b', 'c'];
	const stream1 = await arrayToStream(streamContents, true);

	const filtered = stream1.pipe(filterStream(async content => {
		// Wait for 100ms to simulate a slow filter and test async functionality.
		await new Promise(resolve => setTimeout(resolve, 100));
		return content === 'a';
	}));

	const filteredContents = await streamToArray(filtered);
	assert.deepStrictEqual(filteredContents, ['a']);
}, 'test filterStream() functionality');

await test.run(() => {
	assert.equal(typeof renderMarkdown, 'function', 'default export from markdown should be a function');
	assert.throws(() => renderMarkdown(null), 'should throw an error if first argument is null');
	assert.throws(() => renderMarkdown(''), 'should throw an error if first argument is a string');
	assert.doesNotThrow(() => renderMarkdown({}), 'should not throw an error if first argument is an object');
	assert.doesNotThrow(() => renderMarkdown([]), 'should not throw an error if first argument is an array');
}, 'test renderMarkdown() basic functionality');

await test.run(() => {
	const input = [
		['a', 'b', 'c'],
		['d', 'e', 'f'],
	];

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| -------- | -------- | -------- |',
		'| a        | b        | c        |',
		'| d        | e        | f        |',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate a table from an array of arrays');
}, 'test renderMarkdown(2d_array)');

await test.run(() => {
	const input = ['a', 'b', 'c'];

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| -------- | -------- | -------- |',
		'| a        | b        | c        |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate a table from an array');
}, 'test renderMarkdown(1d_array)');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		]
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| -------- | -------- | -------- |',
		'| a        | b        | c        |',
		'| d        | e        | f        |',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate a table from an object with a data property');
}, 'test renderMarkdown(options)');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		],

		headers: ['Header 1', 'Header 2', 'Header 3']
	};

	const expected = [
		'| Header 1 | Header 2 | Header 3 |',
		'| -------- | -------- | -------- |',
		'| a        | b        | c        |',
		'| d        | e        | f        |',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using custom headers if options.headers is set');
}, 'test renderMarkdown() options.headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		],

		headers: ['Header 1', 'Header 2'],
	};

	const expected = [
		'| Header 1 | Header 2 | Column 3 |',
		'| -------- | -------- | -------- |',
		'| a        | b        | c        |',
		'| d        | e        | f        |',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate missing headers if partial options.headers is set');
}, 'test renderMarkdown() partial options.headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		],

		headers: ['Header 1', 'Header 2', 'Header 3', 'Header 4'],
	};

	const expected = [
		'| Header 1 | Header 2 | Header 3 | Header 4 |',
		'| -------- | -------- | -------- | -------- |',
		'| a        | b        | c        |          |',
		'| d        | e        | f        |          |',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should include empty fields for excessive headers');
}, 'test renderMarkdown() excessive options.headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		],

		minimalOutput: true
	};

	const expected = [
		'|Column 1|Column 2|Column 3|',
		'|-|-|-|',
		'|a|b|c|',
		'|d|e|f|',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate minimal output if options.minimalOutput is true');
}, 'test renderMarkdown() options.minimalOutput');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		],

		headers: ['Header 1', 'Header 2', 'Header 3'],
		minimalOutput: true
	};

	const expected = [
		'|Header 1|Header 2|Header 3|',
		'|-|-|-|',
		'|a|b|c|',
		'|d|e|f|',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate minimal output with custom headers if options.minimalOutput is true');
}, 'test renderMarkdown() options.minimalOutput with custom headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		],

		headers: ['Header 1', 'Header 2', 'Header 3', 'Header 4'],
		minimalOutput: true
	};

	const expected = [
		'|Header 1|Header 2|Header 3|Header 4|',
		'|-|-|-|-|',
		'|a|b|c||',
		'|d|e|f||',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate minimal output with excessive headers if options.minimalOutput is true');
}, 'test renderMarkdown() options.minimalOutput with excessive headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
		],

		headers: ['Header 1', 'Header 2'],
		minimalOutput: true
	};

	const expected = [
		'|Header 1|Header 2|Column 3|',
		'|-|-|-|',
		'|a|b|c|',
		'|d|e|f|',
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate minimal output with partial headers if options.minimalOutput is true');
}, 'test renderMarkdown() options.minimalOutput with partial headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		headerPrefix: 'Foo '
	};

	const expected = [
		'| Foo 1 | Foo 2 | Foo 3 |',
		'| ----- | ----- | ----- |',
		'| a     | b     | c     |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set');
}, 'test renderMarkdown() options.headerPrefix');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		headerPrefix: 'Foo ',
		minimalOutput: true
	};

	const expected = [
		'|Foo 1|Foo 2|Foo 3|',
		'|-|-|-|',
		'|a|b|c|'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set and options.minimalOutput is true');
}, 'test renderMarkdown() options.headerPrefix with options.minimalOutput');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		headers: ['Header 1', 'Header 2'],
		headerPrefix: 'Foo ',
		minimalOutput: true
	};

	const expected = [
		'|Header 1|Header 2|Foo 3|',
		'|-|-|-|',
		'|a|b|c|'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set and options.minimalOutput is true');
}, 'test renderMarkdown() options.headerPrefix with partial headers and options.minimalOutput');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		headers: ['Header 1', 'Header 2'],
		headerPrefix: 'Foo '
	};

	const expected = [
		'| Header 1 | Header 2 | Foo 3 |',
		'| -------- | -------- | ----- |',
		'| a        | b        | c     |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set with partial headers');
}, 'test renderMarkdown() options.headerPrefix with partial headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		headers: ['1', '2', '3']
	};

	const expected = [
		'| 1 | 2 | 3 |',
		'| - | - | - |',
		'| a | b | c |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should only generate separators as long as necessary');
}, 'test renderMarkdown() separator length for short headers');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],
		
		alignment: ['left', 'center', 'right']
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| :------- | :------: | -------: |',
		'| a        | b        | c        |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using aligned separator row if alignment is specified');
}, 'test renderMarkdown() options.alignment');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: ['left', 'center', 'right'],
		minimalOutput: true
	};

	const expected = [
		'|Column 1|Column 2|Column 3|',
		'|:-|:-:|-:|',
		'|a|b|c|'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using aligned separator row and minimal output');
}, 'test renderMarkdown() options.alignment with options.minimalOutput');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: 'left'
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| :------- | :------- | :------- |',
		'| a        | b        | c        |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using left aligned separator row if alignment is specified as left');
}, 'test renderMarkdown() options.alignment as left string');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: 'center'
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| :------: | :------: | :------: |',
		'| a        | b        | c        |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using center aligned separator row if alignment is specified as center');
}, 'test renderMarkdown() options.alignment as right string');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: 'right'
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| -------: | -------: | -------: |',
		'| a        | b        | c        |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using right aligned separator row if alignment is specified as right');
}, 'test renderMarkdown() options.alignment as right string');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: 'left',
		minimalOutput: true
	};

	const expected = [
		'|Column 1|Column 2|Column 3|',
		'|:-|:-|:-|',
		'|a|b|c|'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using left aligned separator row and minimal output');
}, 'test renderMarkdown() options.alignment as left string with options.minimalOutput');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: 'center',
		minimalOutput: true
	};

	const expected = [
		'|Column 1|Column 2|Column 3|',
		'|:-:|:-:|:-:|',
		'|a|b|c|'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using center aligned separator row and minimal output');
}, 'test renderMarkdown() options.alignment as center string with options.minimalOutput');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: 'right',
		minimalOutput: true
	};

	const expected = [
		'|Column 1|Column 2|Column 3|',
		'|-:|-:|-:|',
		'|a|b|c|'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using right aligned separator row and minimal output');
}, 'test renderMarkdown() options.alignment as right string with options.minimalOutput');

await test.run(() => {
	const input = {
		data: [
			['a', 'b', 'c']
		],

		alignment: ['l', 'c', 'r']
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| :------- | :------: | -------: |',
		'| a        | b        | c        |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate using aligned separator row if alignment is specified as shorthand');
}, 'test renderMarkdown() options.alignment as array using shorthand');

await test.run(() => {
	const input = {
		data: [
			['a|b', 'c|d', 'e|f']
		]
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| -------- | -------- | -------- |',
		'| a&#124;b | c&#124;d | e&#124;f |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should escape pipe characters to HTML entites');
}, 'test renderMarkdown() pipe character escaping in cell content');

await test.run(() => {
	const input = {
		data: [
			['string', 50.4, undefined, null, { foo: 'bar'}, ['a', 'b', 'c']]
		]
	};

	const expected = [
		'| Column 1 | Column 2 | Column 3 | Column 4 | Column 5        | Column 6 |',
		'| -------- | -------- | -------- | -------- | --------------- | -------- |',
		'| string   | 50.4     |          |          | [object Object] | a,b,c    |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should convert non-string values to strings');
}, 'test renderMarkdown() non-string values');

await test.run(() => {
	test.capture(() => {
		const instance = new Log();

		assert.notEqual(instance, log, 'new Log() should not return global log instance');
		assert.ok(instance instanceof log.constructor, 'new Log() should return a new log instance');
	});
}, 'test new Log()');

await test.run(() => {
	test.capture(() => {
		const instance = new Log();
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
}, 'test log fluent API')

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
}, 'test log.write() basic functionality');

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
}, 'test log.setPrefix()');

await test.run(() => {
	test.capture((stdout) => {
		assert.equal(log._lineTerminator, '\n', 'Default line terminator should be \\n');

		log.setLineTerminator('\r\n');
		assert.equal(log._lineTerminator, '\r\n', 'Line terminator should be \\r\\n');
		log.write('Hello, world!');

		assert.equal(stdout.shift(), 'Hello, world!\r\n');

		const instance = new Log();
		assert.equal(instance._lineTerminator, '\n', 'Instance should not inherit line terminator');

		log.setLineTerminator('\n');
		instance.setLineTerminator('\r\n');

		assert.equal(log._lineTerminator, '\n', 'Global line terminator should not be overwritten by instance');

	});
}, 'test log.setLineTerminator()');

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

		const instance = new Log();
		assert.equal(instance._indentString, '\t', 'Instance should not inherit indent string');

		log.setIndentString('\t');
		instance.setIndentString('  ');

		assert.equal(log._indentString, '\t', 'Global indent string should not be overwritten by instance');
	});
}, 'test log.indent(), log.dedent(), log.clearIndent(), log.setIndentString()');

await test.run(() => {
	test.capture((stdout, stderr) => {
		const instance = new Log();
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
}, 'test log custom logging levels');

await test.run(() => {
	test.capture((stdout) => {
		const instance = new Log();
		instance.custom('test', '[{test}] ', process.stdout, e => e.toUpperCase());

		instance.test('Hello, world!');
		assert.equal(stdout.shift(), '[TEST] Hello, world!\n');

		// Colour decorating
		instance.custom('test', '[{test}] ', process.stdout, log.pc.red);
		instance.test('Hello, {world}!');
		assert.equal(stdout.shift(), '[\u001b[31mtest\x1b[39m] Hello, \u001b[31mworld\x1b[39m!\n');
	});
}, 'test log.custom() decoration');

await test.run(() => {
	test.capture((stdout, stderr) => {
		const instance = new Log()

		instance.info('This is an {information} message about %s!', 'something');
		assert.equal(stdout.shift(), '[\x1B[36mi\x1B[39m] This is an \x1B[36minformation\x1B[39m message about something!\n');

		instance.warn('This is a {warning} message about %s!', 'something');
		assert.equal(stderr.shift(), '[\x1B[33m!\x1B[39m] This is a \x1B[33mwarning\x1B[39m message about something!\n');

		instance.error('This is an {error} message about %s!', 'something');
		assert.equal(stderr.shift(), '[\x1B[31mx\x1B[39m] This is an \x1B[31merror\x1B[39m message about something!\n');

		instance.success('This is a {success} message about %s!', 'something');
		assert.equal(stdout.shift(), '[\x1B[32m✓\x1B[39m] This is a \x1B[32msuccess\x1B[39m message about something!\n');
	});
}, 'test log builtin logging levels');

await test.run(() => {
	// Create a Date instance for 13th December 1993, 16:30:28
	const date = new Date(1993, 11, 5, 16, 30, 28);

	/*
	* d - Day of the month (01-31) (2 digits)
	* D - Day of the week (Mon-Sun) (3 letters)
	* j - Day of the month (1-31) (1 or 2 digits)
	* l - Day of the week (Monday-Sunday) (full name)
	* N - ISO-8601 numeric representation of the day of the week (1-7)
	* S - English ordinal suffix for the day of the month (2 characters)
	* w - Numeric representation of the day of the week (0-6)
	* z - The day of the year (0-365)
	* F - Month (January-December) (full name)
	* m - Numeric representation of a month (01-12) (2 digits)
	* M - Month (Jan-Dec) (3 letters)
	* n - Numeric representation of a month (1-12) (1 or 2 digits)
	* t - Number of days in the given month (28-31)
	* L - Whether it's a leap year (1 or 0)
	* Y - A full numeric representation of a year (4 digits)
	* y - A two digit representation of a year (2 digits)
	* a - Lowercase Ante meridiem and Post meridiem (am or pm)
	* A - Uppercase Ante meridiem and Post meridiem (AM or PM)
	* g - 12-hour format of an hour (1-12) (1 or 2 digits)
	* G - 24-hour format of an hour (0-23) (1 or 2 digits)
	* h - 12-hour format of an hour (01-12) (2 digits)
	* H - 24-hour format of an hour (00-23) (2 digits)
	* i - Minutes with leading zeros (00-59) (2 digits)
	* s - Seconds with leading zeros (00-59) (2 digits)
	*/

	assert.equal(formatDate('d', date), '05', 'formatDate(): "d" should return the day of the month (2 digits)');
	assert.equal(formatDate('D', date), 'Sun', 'formatDate(): "D" should return the day of the week (3 letters)');
	assert.equal(formatDate('j', date), '5', 'formatDate(): "j" should return the day of the month (1 digit)');
	assert.equal(formatDate('l', date), 'Sunday', 'formatDate(): "l" should return the day of the week (full)');
	assert.equal(formatDate('N', date), '7', 'formatDate(): "N" should return the ISO-8601 numeric representation of the day of the week (1 digit)');
	assert.equal(formatDate('S', date), 'th', 'formatDate(): "S" should return the English ordinal suffix for the day of the month (2 letters)');
	assert.equal(formatDate('w', date), '0', 'formatDate(): "w" should return the numeric representation of the day of the week (1 digit)');
	assert.equal(formatDate('z', date), '338', 'formatDate(): "z" should return the day of the year (3 digits)');
	assert.equal(formatDate('z', new Date(1993, 0, 1)), '0', 'formatDate(): "z" should return the day of the year (3 digits)');
	assert.equal(formatDate('z', new Date(1993, 11, 31)), '364', 'formatDate(): "z" should return the day of the year (3 digits)');
	assert.equal(formatDate('F', date), 'December', 'formatDate(): "F" should return the month (full)');
	assert.equal(formatDate('m', date), '12', 'formatDate(): "m" should return the month (2 digits)');
	assert.equal(formatDate('M', date), 'Dec', 'formatDate(): "M" should return the month (3 letters)');
	assert.equal(formatDate('n', date), '12', 'formatDate(): "n" should return the month (1 digit)');
	assert.equal(formatDate('t', date), '31', 'formatDate(): "t" should return the number of days in the given month (2 digits)');
	assert.equal(formatDate('L', date), '0', 'formatDate(): "L" should return whether it\'s a leap year (1 digit)');
	assert.equal(formatDate('Y', date), '1993', 'formatDate(): "Y" should return the full numeric representation of a year (4 digits)');
	assert.equal(formatDate('y', date), '93', 'formatDate(): "y" should return the two digit representation of a year (2 digits)');
	assert.equal(formatDate('a', date), 'pm', 'formatDate(): "a" should return the lowercase Ante meridiem and Post meridiem (2 letters)');
	assert.equal(formatDate('A', date), 'PM', 'formatDate(): "A" should return the uppercase Ante meridiem and Post meridiem (2 letters)');
	assert.equal(formatDate('g', date), '4', 'formatDate(): "g" should return the 12-hour format of an hour (1 digit)');
	assert.equal(formatDate('G', date), '16', 'formatDate(): "G" should return the 24-hour format of an hour (2 digits)');
	assert.equal(formatDate('h', date), '04', 'formatDate(): "h" should return the 12-hour format of an hour (2 digits)');
	assert.equal(formatDate('H', date), '16', 'formatDate(): "H" should return the 24-hour format of an hour (2 digits)');
	assert.equal(formatDate('i', date), '30', 'formatDate(): "i" should return the minutes with leading zeros (2 digits)');
	assert.equal(formatDate('s', date), '28', 'formatDate(): "s" should return the seconds with leading zeros (2 digits)');

	// Test character escaping.
	assert.equal(formatDate('\\Y\\m\\d', date), 'Ymd', 'formatDate(): "\Y\m\d" should return "Ymd"');

	// Test combination: Y-m-d H:i:s
	assert.equal(formatDate('Y-m-d H:i:s', date), '1993-12-05 16:30:28', 'formatDate(): "Y-m-d H:i:s" should return the full date and time');

	// Test combination: l \t\h\e jS
	assert.equal(formatDate('l \\t\\h\\e jS', date), 'Sunday the 5th', 'formatDate(): "l \t\h\e jS" should return "Sunday the 5th"');

	// Test providing a UNIX timestamp as the date.
	assert.equal(formatDate('Y-m-d', 1234567890), '2009-02-13', 'formatDate(): "Y-m-d" should return "2009-02-13"');

	// Test providing a date string as the date.
	assert.equal(formatDate('Y-m-d', '2009-02-13'), '2009-02-13', 'formatDate(): "Y-m-d" should return "2009-02-13"');

}, 'test formatDate()');

await test.results();