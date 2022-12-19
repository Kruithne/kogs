'use strict';

import { Readable } from 'node:stream';

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