import test from '@kogs/test';
import assert from 'node:assert/strict';
import markdown from './index.mjs';

(async () => {
	await test.run(() => {
		assert.equal(typeof markdown, 'function', 'default export from markdown should be a function');
		assert.throws(() => markdown(null), 'should throw an error if first argument is null');
		assert.throws(() => markdown(''), 'should throw an error if first argument is a string');
		assert.doesNotThrow(() => markdown({}), 'should not throw an error if first argument is an object');
		assert.doesNotThrow(() => markdown([]), 'should not throw an error if first argument is an array');
	}, 'general tests');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate a table from an array of arrays');
	}, 'test markdown(2d_array)');

	await test.run(() => {
		const input = ['a', 'b', 'c'];

		const expected = [
			'| Column 1 | Column 2 | Column 3 |',
			'| -------- | -------- | -------- |',
			'| a        | b        | c        |'
		].join('\n');

		const output = markdown(input);
		assert.equal(output, expected, 'should generate a table from an array');
	}, 'test markdown(1d_array)');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate a table from an object with a data property');
	}, 'test markdown(options)');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using custom headers if options.headers is set');
	}, 'test options.headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate missing headers if partial options.headers is set');
	}, 'test partial options.headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should include empty fields for excessive headers');
	}, 'test excessive options.headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate minimal output if options.minimalOutput is true');
	}, 'test options.minimalOutput');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate minimal output with custom headers if options.minimalOutput is true');
	}, 'test options.minimalOutput with custom headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate minimal output with excessive headers if options.minimalOutput is true');
	}, 'test options.minimalOutput with excessive headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate minimal output with partial headers if options.minimalOutput is true');
	}, 'test options.minimalOutput with partial headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set');
	}, 'test options.headerPrefix');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set and options.minimalOutput is true');
	}, 'test options.headerPrefix with options.minimalOutput');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set and options.minimalOutput is true');
	}, 'test options.headerPrefix with partial headers and options.minimalOutput');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using custom header prefix if options.headerPrefix is set with partial headers');
	}, 'test options.headerPrefix with partial headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should only generate separators as long as necessary');
	}, 'test separator length for short headers');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using aligned separator row if alignment is specified');
	}, 'test options.alignment');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using aligned separator row and minimal output');
	}, 'test options.alignment with options.minimalOutput');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using left aligned separator row if alignment is specified as left');
	}, 'test options.alignment as left string');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using center aligned separator row if alignment is specified as center');
	}, 'test options.alignment as right string');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using right aligned separator row if alignment is specified as right');
	}, 'test options.alignment as right string');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using left aligned separator row and minimal output');
	}, 'test options.alignment as left string with options.minimalOutput');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using center aligned separator row and minimal output');
	}, 'test options.alignment as center string with options.minimalOutput');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using right aligned separator row and minimal output');
	}, 'test options.alignment as right string with options.minimalOutput');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should generate using aligned separator row if alignment is specified as shorthand');
	}, 'test options.alignment as array using shorthand');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should escape pipe characters to HTML entites');
	}, 'test pipe character escaping in cell content');

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

		const output = markdown(input);
		assert.equal(output, expected, 'should convert non-string values to strings');
	}, 'test non-string values');

	await test.results();
})();