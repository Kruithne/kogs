import { test, streamToArray, streamToBuffer, arrayToStream } from './index.mjs';
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

await test.results();