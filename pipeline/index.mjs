import glob from 'glob';
import fs from 'node:fs';
import stream from 'node:stream';
import path from 'node:path';

class FileObject {
	/**
	 * @param {string} path
	 */
	constructor(path) {
		this.path = path;
		this.stats = null;
		this._data = null;

		this.updateStats();
	}

	/**
	 * Retrieve the file contents buffer.
	 * This is a lazy getter, the file is only read when this property is accessed.
	 * Once read, the file contents are cached. To clear the cache, set this property to null.
	 * @returns {Buffer}
	 */
	get data() {
		if (this._data === null)
			this._data = fs.readFileSync(this.path);

		return this._data;
	}

	/**
	 * Set the file contents buffer.
	 * This does not write the file to the file system.
	 * @param {Buffer|null} value
	 */
	set data(value) {
		this._data = value;
	}

	/**
	 * Update the file stats.
	 */
	updateStats() {
		this.stats = fs.statSync(this.path);
	}
}

/**
 * Collect files from the file system and return a readable stream.
 * @param {string} pattern 
 * @param {object} [globOptions]
 * @returns {stream.Readable}
 */
export function src(pattern, globOptions) {
	const files = glob.sync(pattern, globOptions);

	return new stream.Readable({
		objectMode: true,

		read() {
			for (const file of files)
				this.push(new FileObject(file));

			this.push(null);
		}
	});
}

/**
 * Writes files in the stream to the file system.
 * File stats are updated to reflect the new file.
 * @param {string} dir 
 * @returns {stream.Readable}
 */
export function dest(dir) {
	return new stream.Transform({
		objectMode: true,

		transform(chunk, encoding, callback) {
			const newPath = path.posix.join(dir, path.relative(path.dirname(chunk.path), chunk.path));
			
			// Make the necessary directories and write file to the file system.
			fs.mkdirSync(path.dirname(newPath), { recursive: true });
			fs.writeFileSync(newPath, chunk.data);

			chunk.path = newPath;
			chunk.updateStats();

			callback(null, chunk);
		}
	})
}

/**
 * Run a function for each file in the stream.
 * @param {function} fn 
 * @returns {stream.Readable}
 */
export function transform(fn) {
	return new stream.Transform({
		objectMode: true,

		async transform(chunk, encoding, callback) {
			await fn(chunk);
			callback(null, chunk);
		}
	});
}

/**
 * Filter files in the stream based on the return value of the function.
 * @param {function} fn 
 * @returns {stream.Readable}
 */
export function filter(fn) {
	return new stream.Transform({
		objectMode: true,

		async transform(chunk, encoding, callback) {
			const result = await fn(chunk);
			result ? callback(null, chunk) : callback();
		}
	});
}

export default { src, dest, transform, filter };