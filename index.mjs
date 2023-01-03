'use strict';

import { Readable, Transform, PassThrough } from 'node:stream';
import { createInterface } from 'node:readline';
import util from 'node:util';
import pc from 'picocolors';

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

const _date_longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const _date_longMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Formats a given date using the given format string.
 * This function closely matches the behavior of PHP's date() function (https://www.php.net/manual/en/datetime.format.php).
 * Individual characters in the format can be escaped with a backslash.
 * The following characters in a format string are replaced with the corresponding date/time values:
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
 * @param {string} format 
 * @param {Date|number|string} [date]
 * @returns {string}
 */
export function formatDate(format, date) {
	// If date is undefined, use current date.
	if (date === undefined)
		date = new Date();

	// If date is a number, treat it as a UNIX timestamp.
	if (typeof date === 'number')
		date = new Date(date * 1000);

	// If date is a string, treat it as a date string.
	if (typeof date === 'string')
		date = new Date(date);

	const _date = date.getDate();
	const _day = date.getDay();
	const _month = date.getMonth();
	const _year = date.getFullYear();
	const _hours = date.getHours();
	const _minutes = date.getMinutes();
	const _seconds = date.getSeconds();

	let out = '';
	let skip = false;
	for (let i = 0, n = format.length; i < n; i++) {
		let char = format[i];

		if (!skip) {
			switch (char) {
				// Escape character.
				case '\\': skip = true; continue;

				// Day of the month (01-31) (2 digits)
				case 'd': char = _date.toString().padStart(2, '0'); break;

				// Day of the week (Mon-Sun) (3 letters)
				case 'D': char = _date_longDays[_day].substring(0, 3); break;

				// Day of the month (1-31) (1 or 2 digits)
				case 'j': char = _date.toString(); break;

				// Day of the week (Monday-Sunday) (full name)
				case 'l': char = _date_longDays[_day]; break;

				// ISO-8601 numeric representation of the day of the week (1-7)
				// 1 for Monday, 7 for Sunday
				case 'N': char = (_day + 6) % 7 + 1; break;

				// English ordinal suffix for the day of the month (2 characters)
				case 'S': char = _date % 10 === 1 ? 'st' :_date % 10 === 2 ? 'nd' : _date % 10 === 3 ? 'rd' : 'th'; break;

				// Numeric representation of the day of the week (0-6)
				case 'w': char = _day.toString(); break;

				// The day of the year (0-365)
				case 'z': char = Math.floor((date - new Date(_year, 0, 1)) / 86400000); break;

				// Month (January-December) (full name)
				case 'F': char = _date_longMonth[_month]; break;

				// Numeric representation of a month (01-12) (2 digits)
				case 'm': char = (_month + 1).toString().padStart(2, '0'); break;

				// Month (Jan-Dec) (3 letters)
				case 'M': char = _date_longMonth[_month].substring(0, 3); break;

				// Numeric representation of a month (1-12) (1 or 2 digits)
				case 'n': char = (_month + 1).toString(); break;

				// Number of days in the given month (28-31)
				case 't': char = new Date(_year, _month + 1, 0).getDate().toString(); break;

				// Whether it's a leap year (1 or 0)
				case 'L': char = (_year % 4 === 0 && _year % 100 !== 0) || _year % 400 === 0 ? '1' : '0'; break;

				// A full numeric representation of a year (4 digits)
				case 'Y': char = _year.toString(); break;

				// A two digit representation of a year (2 digits)
				case 'y': char = _year.toString().substring(2); break;

				// Lowercase Ante meridiem and Post meridiem (am or pm)
				case 'a': char = _hours < 12 ? 'am' : 'pm'; break;

				// Uppercase Ante meridiem and Post meridiem (AM or PM)
				case 'A': char = _hours < 12 ? 'AM' : 'PM'; break;

				// 12-hour format of an hour (1-12) (1 or 2 digits)
				case 'g': char = (_hours % 12 || 12).toString(); break;

				// 24-hour format of an hour (0-23) (1 or 2 digits)
				case 'G': char = _hours.toString(); break;

				// 12-hour format of an hour (01-12) (2 digits)
				case 'h': char = (_hours % 12 || 12).toString().padStart(2, '0'); break;

				// 24-hour format of an hour (00-23) (2 digits)
				case 'H': char = _hours.toString().padStart(2, '0'); break;

				// Minutes with leading zeros (00-59) (2 digits)
				case 'i': char = _minutes.toString().padStart(2, '0'); break;

				// Seconds with leading zeros (00-59) (2 digits)
				case 's': char = _seconds.toString().padStart(2, '0'); break;
			}
		} else {
			skip = false;
		}

		out += char;
	}

	return out;
}

export class Log {
	_lineTerminator = '\n';
	_indentString = '\t';
	_indentLevel = 0;
	_prefix = '';
	_customLevels = [];

	constructor() {
		this.custom('info', '[{i}] ', process.stdout, pc.cyan);
		this.custom('warn', '[{!}] ', process.stderr, pc.yellow);
		this.custom('error', '[{x}] ', process.stderr, pc.red);
		this.custom('success', '[{✓}] ', process.stdout, pc.green);
	}

	/**
	 * Returns the picocolors module.
	 * @returns {object}
	 */
	get pc() {
		return pc;
	}

	/**
	 * Write a message to the console.
	 * @param {string} message 
	 * @param {...any} args
	 * @returns {Log}
	 */
	write(message, ...args) {
		let output = util.format(message, ...args) + this._lineTerminator;

		if (this._indentLevel > 0)
			output = this._indentString.repeat(this._indentLevel) + output;

		if (this._prefix.length > 0)
			output = this._prefix + output;

		process.stdout.write(output);
		return this;
	}

	/**
	 * Create a custom logging level.
	 * @param {string} name 
	 * @param {string} [prefix]
	 * @param {Stream} pipe 
	 * @param {function} decorator 
	 * @returns {function}
	 */
	custom(name, prefix, pipe, decorator) {
		/**
		 * @param {string} message
		 * @param {...any} args
		 * @returns {Log}
		 */
		const fn = (message, ...args) => {
			let output = util.format(message, ...args) + this._lineTerminator;

			if (this._indentLevel > 0)
				output = this._indentString.repeat(this._indentLevel) + output;

			if (this._prefix.length > 0)
				output = this._prefix + output;

			if (prefix && prefix.length > 0)
				output = prefix + output;

			if (decorator !== undefined) {
				output = output.replace(/{(.*?)}/g, (_, p1) => {
					return decorator(p1);
				});
			}

			pipe.write(output);
			return this;
		};

		// Custom levels can be added to the instance if they do not conflict with existing methods.
		// Injected custom level methods *can* safely by overwritten, allowing customization of existing levels.
		if (this[name] === undefined || this._customLevels.includes(name)) {
			this[name] = fn;
			this._customLevels.push(name);
		} else {
			throw new Error('Cannot create custom logging level with reserved name: ' + name);
		}

		return fn;
	}

	/**
	 * Increase the indentation level.
	 * @param {number} amount 
	 * @returns {Log}
	 */
	indent(amount = 1) {
		this._indentLevel += amount;
		return this;
	}

	/**
	 * Decrease the indentation level.
	 * @param {number} amount 
	 * @returns {Log}
	 */
	dedent(amount = 1) {
		this._indentLevel -= amount;
		return this;
	}

	/**
	 * Clears the indentation level.
	 * @returns {Log}
	 */
	clearIndent() {
		this._indentLevel = 0;
		return this;
	}

	/**
	 * Set a prefix to be prepended to all messages.
	 * @param {string} prefix 
	 * @returns {Log}
	 */
	setPrefix(prefix) {
		this._prefix = prefix ?? '';
		return this;
	}

	/**
	 * Set the line terminator.
	 * @param {string} terminator 
	 * @returns {Log}
	 */
	setLineTerminator(terminator) {
		this._lineTerminator = terminator;
		return this;
	}

	/**
	 * Sets the indentation string.
	 * @param {string} indent 
	 * @returns {Log}
	 */
	setIndentString(indent) {
		this._indentString = indent;
		return this;
	}

	/**
	 * Prompts the user for input and returns the response.
	 * @param {string} message 
	 * @returns {string}
	 */
	async prompt(message) {
		return new Promise((resolve) => {
			const rl = createInterface({
				input: process.stdin,
				output: process.stdout
			});

			rl.question(message, answer => {
				rl.close();
				resolve(answer);
			});
		});
	}
}

export const log = new Log();