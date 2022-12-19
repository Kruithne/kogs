import { test, streamToArray, streamToBuffer, arrayToStream, renderMarkdown } from './index.mjs';
import { Readable } from 'node:stream';
import assert from 'node:assert/strict';

test.run(async () => {
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

test.run(async () => {
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

test.run(async () => {
	const input = [1, 2, 3, 4, 5];
	const stream = await arrayToStream(input, true);
	
	const output = [];
	for await (const chunk of stream)
		output.push(chunk);
		
	assert.deepStrictEqual(output, input, 'arrayToStream should return a stream of the array contents');
}, 'test arrayToStream functionality with objectMode=true');

test.run(async () => {
	const input = ['foo', 'bar', 'baz', 'qux'];
	const stream = await arrayToStream(input, false);
	
	const buffers = [];
	for await (const chunk of stream)
		buffers.push(chunk);

	const output = Buffer.concat(buffers).toString();
	assert.deepStrictEqual(output, input.join(''), 'arrayToStream should return a stream of the array contents');
}, 'test arrayToStream functionality with objectMode=false');

test.run(() => {
	assert.equal(typeof renderMarkdown, 'function', 'default export from markdown should be a function');
	assert.throws(() => renderMarkdown(null), 'should throw an error if first argument is null');
	assert.throws(() => renderMarkdown(''), 'should throw an error if first argument is a string');
	assert.doesNotThrow(() => renderMarkdown({}), 'should not throw an error if first argument is an object');
	assert.doesNotThrow(() => renderMarkdown([]), 'should not throw an error if first argument is an array');
}, 'test renderMarkdown() basic functionality');

test.run(() => {
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

test.run(() => {
	const input = ['a', 'b', 'c'];

	const expected = [
		'| Column 1 | Column 2 | Column 3 |',
		'| -------- | -------- | -------- |',
		'| a        | b        | c        |'
	].join('\n');

	const output = renderMarkdown(input);
	assert.equal(output, expected, 'should generate a table from an array');
}, 'test renderMarkdown(1d_array)');

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

test.run(() => {
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

await test.results();