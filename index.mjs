'use strict';

import { Readable, Transform, PassThrough } from 'node:stream';
import { readFile } from 'node:fs/promises';

export const test = {
	_testID: 1,
	_nPassedTests: 0,
	_nFailedTests: 0,
	_promises: [],

	/**
	 * Run a test.
	 * @param {function} fn 
	 * @param {string} [name]
	 * @return {Promise}
	 */
	async run(fn, name) {
		const testPromise = new Promise(async (resolve) => {
			let testName = name;
	
			// If no name was provided, try to get the name from the function
			// or use the testID as a final fallback.
			if (!testName) {
				if (fn.name && fn.name.length > 0)
					testName = fn.name;
				else
					testName = `Test #${this._testID}`;
			}
	
			// Always increment testID even when using a custom name.
			// This keeps the test IDs consistent and easier to identify.
			this._testID++;
	
			const testStart = Date.now();
	
			let error;
			try {
				await fn();
			} catch (e) {
				error = e.message;
	
				if (e.stack) {
					const line = e.stack.split('\n').find(line => /^\s*at/.test(line));
	
					if (line)
						error += ' (' + line.trim() + ')';
				}
			}
	
			const testDuration = Date.now() - testStart;
	
			if (error !== undefined) {
				console.log('\x1b[31m[x] %s failed after %dms :: %s\x1b[39m', testName, testDuration, error);
				this._nFailedTests++;
			} else {
				console.log('\x1b[32m[✓] %s passed after %dms\x1b[39m', testName, testDuration);
				this._nPassedTests++;
			}
	
			resolve();
		});
	
		this._promises.push(testPromise);
		return testPromise;
	},

	/**
	 * Prints the results of tests and resets internal
	 * state for the next batch of test runs.
	 * @return {Promise}
	 */
	async results() {
		// Wait for all test promises to resolve.
		await Promise.all(this._promises);

		let strPassed = '\x1b[32m' + this._nPassedTests + ' passed\x1b[39m';
		let strFailed = '\x1b[31m' + this._nFailedTests + ' failed\x1b[39m';

		console.log('\n%s, %s', strPassed, strFailed);

		// Reset internal testing state.
		this._testID = 1;
		this._nPassedTests = 0;
		this._nFailedTests = 0;
	},

	/**
	 * Captures input written to stdout/stderr and writes them into
	 * the arrays provided to fn. Functionality is restored once fn
	 * resolves.
	 * @param {function} fn 
	 * @return { Promise<{ stdout: string[], stderr: string[] }> }
	 */
	async capture(fn) {
		const stdout_write = process.stdout.write;
		const stderr_write = process.stderr.write;

		const stdout = [];
		const stderr = [];

		process.stdout.write = (chunk) => stdout.push(chunk);
		process.stderr.write = (chunk) => stderr.push(chunk);

		try {
			await fn(stdout, stderr);
		} catch (e) {
			throw e;
		} finally {
			process.stdout.write = stdout_write;
			process.stderr.write = stderr_write;
		}

		return { stdout, stderr };
	}
};

/**
 * Creates a readable stream and pushes the given array into it.
 * @param {Array} input 
 * @param {boolean} [objectMode]
 * @returns {Promise<stream.Readable>}
 */
export async function arrayToStream(input, objectMode) {
	// If objectMode is not specified, try to guess it from the first.
	if (objectMode === undefined) {
		const first = input[0];
		objectMode = typeof first === 'object' && first !== null;
	}

	const output = new Readable({
		objectMode,
		read() {
			for (const content of input)
				this.push(content);
			this.push(null);
		}
	});

	return output;
}

/**
 * Consumes a stream and returns an array of its contents.
 * @param {stream.Readable} input 
 * @returns {Promise<Array>}
 */
export async function streamToArray(input) {
	const output = [];

	for await (const chunk of input)
		output.push(chunk);

	return output;
}

/**
 * Consumes a stream and returns a buffer of its contents.
 * @param {stream.Readable} input 
 * @returns {Promise<Buffer>}
 */
export async function streamToBuffer(input) {
	const output = [];

	for await (const chunk of input) {
		// If chunk is not a buffer, convert it to one.
		if (!Buffer.isBuffer(chunk))
			chunk = Buffer.from(chunk);

		output.push(chunk);
	}

	return Buffer.concat(output);
}

/**
 * Provides a stream.Transform that filters out chunks that
 * do not pass the given filteirng function.
 * @param {function} fn 
 * @returns {stream.Transform}
 */
export function filterStream(fn) {
	return new Transform({
		objectMode: true,
		async transform(chunk, encoding, callback) {
			if (await fn(chunk))
				this.push(chunk);

			callback();
		}
	});
}

/**
 * Consumes multiple streams and merges them into one.
 * @param  {...stream.Readable} streams 
 * @returns {stream.PassThrough}
 */
export async function mergeStreams(...streams) {
	const merged = new PassThrough({ objectMode: true });

	let ended = 0;
	for (const stream of streams) {
		for await (const data of stream)
			merged.write(data);

		ended += 1;

		if (ended === streams.length)
			merged.end();
	}

	return merged;
}

/**
 * Renders a table in Markdown format.
 * @param {array|object} optionsOrData
 * @param {array} optionsOrData.data
 * @param {array} optionsOrData.headers
 * @param {boolean} optionsOrData.minimalOutput
 * @param {string} optionsOrData.delimiter
 * @returns {string}
 */
export function renderMarkdown(optionsOrData) {
	let options = {
		minimalOutput: false,
		data: [],
		headers: [],
		lineSeparator: '\n',
		headerPrefix: 'Column ',
	};

	if (Array.isArray(optionsOrData)) {
		options.data = optionsOrData;
	} else if (typeof optionsOrData === 'object' && optionsOrData !== null) {
		options = Object.assign(options, optionsOrData);

		// Validate provided options.
		if (typeof options.minimalOutput !== 'boolean')
			throw new Error('options.minimalOutput option expected to be a boolean');

		if (!Array.isArray(options.data))
			throw new Error('options.data option expected to be an array');

		if (!Array.isArray(options.headers))
			throw new Error('options.headers option expected to be an array');

		if (typeof options.lineSeparator !== 'string')
			throw new Error('options.lineSeparator option expected to be a string');

		if (typeof options.headerPrefix !== 'string')
			throw new Error('options.headerPrefix option expected to be a string');

		if (options.alignment !== undefined && !Array.isArray(options.alignment) && typeof options.alignment !== 'string')
			throw new Error('options.alignment option expected to be an array or a string');
	} else {
		throw new Error('markdown() expects to be provided an object or array as its first argument');
	}

	// Ensure options.data is two-dimensional.
	if (!Array.isArray(options.data[0]))
		options.data = [options.data];

	let rowWidth = options.headers.length;
	let maxCellLengths = [];

	for (let i = 0, n = options.headers.length; i < n; i++)
		maxCellLengths[i] = Math.max(options.headers[i].length, 1);

	for (const row of options.data) {
		rowWidth = Math.max(rowWidth, row.length);

		for (let i = 0; i < row.length; i++)
			maxCellLengths[i] = Math.max(maxCellLengths[i] ?? 0, row[i]?.toString?.().length ?? 0);
	}

	// Generate enough headers, if necessary.
	if (options.headers.length < rowWidth) {
		for (let i = options.headers.length; i < rowWidth; i++) {
			options.headers.push(options.headerPrefix + (i + 1));
			maxCellLengths[i] = Math.max(maxCellLengths[i] ?? 0, options.headers[i].length);
		}
	}

	const output = [];

	if (options.minimalOutput) {
		// Generate header row.
		output.push('|' + options.headers.join('|') + '|');

		// Generate separator row.
		if (options.alignment !== undefined) {
			const sharedAlignment = typeof options.alignment === 'string' ? options.alignment[0].toLowerCase() : undefined;
			output.push('|' + options.headers.map((_, i) => {
				const alignment = sharedAlignment ?? options.alignment[i][0].toLowerCase();
				return alignment === 'l' ? ':-' : alignment === 'r' ? '-:' : ':-:';
			}).join('|') + '|');
		} else {
			output.push('|' + options.headers.map(() => '-').join('|') + '|');
		}

		// Generate data rows.
		for (let row of options.data) {
			// Stringify cells.
			row = row.map(cell => cell?.toString?.() ?? '');

			// Escape pipe characters with HTML entity.
			row = row.map(cell => cell.replace(/\|/g, '&#124;'));

			// Overall table width may exceed this row, pad if necessary.
			if (row.length < rowWidth)
				row = row.concat(new Array(rowWidth - row.length).fill(''));

			output.push('|' + row.join('|') + '|');
		}
	} else {
		// Generate header row.
		output.push('| ' + options.headers.map((header, i) => {
			return header.padEnd(maxCellLengths[i]);
		}).join(' | ') + ' |');

		// Generate separator row.
		if (options.alignment !== undefined) {
			const sharedAlignment = typeof options.alignment === 'string' ? options.alignment[0].toLowerCase() : undefined;
			output.push('| ' + options.headers.map((_, i) => {
				const separatorLength = maxCellLengths[i];
				const alignment = sharedAlignment ?? options.alignment[i][0].toLowerCase();

				if (alignment === 'l')
					return ':' + '-'.repeat(separatorLength - 1);
				else if (alignment === 'r')
					return '-'.repeat(separatorLength - 1) + ':';
				else
					return ':' + '-'.repeat(separatorLength - 2) + ':';
			}).join(' | ') + ' |');
		} else {
			output.push('| ' + options.headers.map((_, i) => {
				return '-'.repeat(maxCellLengths[i]);
			}).join(' | ') + ' |');
		}

		// Generate data rows.
		for (let row of options.data) {
			// Stringify cells.
			row = row.map(cell => cell?.toString?.() ?? '');

			// Escape pipe characters with HTML entity.
			row = row.map(cell => cell.replace(/\|/g, '&#124;'));

			// Overall table width may exceed this row, pad if necessary.
			if (row.length < rowWidth)
				row = row.concat(new Array(rowWidth - row.length).fill(''));

			output.push('| ' + row.map((cell, i) => {
				return cell.padEnd(maxCellLengths[i]);
			}).join(' | ') + ' |');
		}
	}

	return output.join(options.lineSeparator);
};