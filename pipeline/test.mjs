import test from '@kogs/test';
import assert from 'node:assert/strict';
import { src, dest, transform } from './index.mjs';
import stream from 'node:stream';
import fs from 'node:fs/promises';

/**
 * Consumes a readable stream and returns an array of all chunks.
 * @returns {Array}
 */
stream.Readable.prototype.toArray = async function () {
	return new Promise((resolve, reject) => {
		const chunks = [];

		this.on('data', (chunk) => chunks.push(chunk));
		this.on('end', () => resolve(chunks));
		this.on('error', (err) => reject(err));
	});
};

(async () => {
	await test.run(async () => {
		const files = await src('test/**/test*.js').toArray();

		assert.equal(files.length, 2, 'pipeline.src() should return two items');

		for (const file of files) {
			assert.equal(typeof file, 'object', 'each item in the array should be an object');
			assert.equal(typeof file.path, 'string', 'file.path should be a string');
			assert.equal(typeof file.stats, 'object', 'file.stat should be an object');
		}
		
		const [file1, file2] = files;

		assert.equal(file1.path, 'test/test.js', 'first file returned should be test/test.js');
		assert.equal(file2.path, 'test/testB.js', 'second file returned should be test/testB.js');	
	}, 'test pipeline.src() functionality');

	await test.run(async () => {
		// Ensure the `testDist` directory is deleted recursively.
		await fs.rm('testDist', { recursive: true, force: true });

		const fileAContents = await fs.readFile('test/test.js', 'utf8');
		const fileBContents = await fs.readFile('test/testB.js', 'utf8');

		const files = await src('test/**/test*.js').pipe(dest('testDist')).toArray();

		assert.equal(files.length, 2, 'pipeline.dest() should return two items');
		assert.equal(files[0].path, 'testDist/test.js', 'first file returned should be testDist/test.js');
		assert.equal(files[1].path, 'testDist/testB.js', 'second file returned should be testDist/testB.js');

		// Test that `testDist` directory was created.
		await fs.access('testDist');

		// Test that `testDist/test.js` file was created and the contents are correct.
		const fileAContentsDist = await fs.readFile('testDist/test.js', 'utf8');
		assert.equal(fileAContents, fileAContentsDist, 'testDist/test.js should have the same contents as test/test.js');

		// Test that `testDist/testB.js` file was created and the contents are correct.
		const fileBContentsDist = await fs.readFile('testDist/testB.js', 'utf8');
		assert.equal(fileBContents, fileBContentsDist, 'testDist/testB.js should have the same contents as test/testB.js');

		// Ensure the `testDist` directory is deleted recursively.
		await fs.rm('testDist', { recursive: true, force: true });

	}, 'test pipeline.dest() functionality');

	await test.run(async () => {
		const files = await src('test/**/test*.js').toArray();

		for (const file of files) {
			assert.equal(file._data, null, 'file internal data should not be loaded until accessed');

			const data = file.data;

			assert.equal(Buffer.isBuffer(data), true, 'file.data should be a buffer');
			assert.equal(data, file._data, 'file.data should be the same as file._data');

			// Updating the data property should update the internal data.
			const newData = Buffer.from('test');
			file.data = newData;

			// Check that the internal data was updated.
			assert.equal(file._data, newData, 'file._data should be the same as file.data');
		}
	}, 'test pipeline.src() lazy-loading');

	await test.run(async () => {
		const transform = new stream.Transform({
			objectMode: true,
		
			transform(chunk, encoding, callback) {
				chunk.data = 'transformed data';
				callback(null, chunk);
			}
		});

		const files = await src('test/**/test*.js').pipe(transform).toArray();

		for (const file of files) {
			assert.equal(typeof file.data, 'string', 'file.data should now be a string');
			assert.equal(file.data, 'transformed data', 'file.data should be transformed');
		}

	}, 'test pipeline transformation');

	await test.run(async () => {
		const transformer = file => {
			file.data = 'transformed data';
		};

		const files = await src('test/**/test*.js').pipe(transform(transformer)).toArray();

		for (const file of files) {
			assert.equal(typeof file.data, 'string', 'file.data should now be a string');
			assert.equal(file.data, 'transformed data', 'file.data should be transformed');
		}
	}, 'test pipeline.transform() functionality');

	await test.run(async () => {
		const transformer = async file => {
			file.data = 'transformed data';

			// Wait for 100ms to simulate async operation.
			await new Promise(resolve => setTimeout(resolve, 100));
		};

		const files = await src('test/**/test*.js').pipe(transform(transformer)).toArray();

		for (const file of files) {
			assert.equal(typeof file.data, 'string', 'file.data should now be a string');
			assert.equal(file.data, 'transformed data', 'file.data should be transformed');
		}
	}, 'test pipeline.watch() async functionality');

	await test.results();
})();