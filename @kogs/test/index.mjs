'use strict';

import pc from 'picocolors';

let testID = 1;
let nPassedTests = 0;
let nFailedTests = 0;
let promises = [];

/**
 * Run a test.
 * @param {function} fn 
 * @param {string} [name]
 */
function run(fn, name) {
	const testPromise = new Promise(async (resolve) => {
		let testName = name;

		// If no name was provided, try to get the name from the function
		// or use the testID as a final fallback.
		if (!testName) {
			if (fn.name && fn.name.length > 0)
				testName = fn.name;
			else
				testName = `Test #${testID}`;
		}

		// Always increment testID even when using a custom name.
		// This keeps the test IDs consistent and easier to identify.
		testID++;

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
			console.log(pc.red('[x] %s failed after %dms :: %s'), testName, testDuration, error);
			nFailedTests++;
		} else {
			console.log(pc.green('[✓] %s passed after %dms'), testName, testDuration)
			nPassedTests++;
		}

		resolve();
	});

	promises.push(testPromise);
	return testPromise;
};

/**
 * Prints the results of tests and resets internal
 * state for the next batch of test runs.
 */
async function results() {
	// Wait for all test promises to resolve.
	await Promise.all(promises);

	let strPassed = pc.green(nPassedTests + ' passed');
	let strFailed = pc.red(nFailedTests + ' failed');

	console.log('\n%s, %s', strPassed, strFailed);

	// Reset internal testing state.
	testID = 1;
	nPassedTests = 0;
	nFailedTests = 0;
};

/**
 * Captures input written to stdout/stderr and writes them into
 * the arrays provided to fn. Functionality is restored once fn
 * resolves.
 * @param {function} fn 
 * @return { Promise<{ stdout: string[], stderr: string[] }> }
 */
async function capture(fn) {
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
};

export { run, results, capture };
export default { run, results, capture };