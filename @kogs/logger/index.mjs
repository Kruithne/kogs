'use strict';

import pc from 'picocolors';
import util from 'node:util';

class Log {
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
	 * picocolors instance.
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
	 * Create a new logging instance which does not inherit settings.
	 * @returns {Log}
	 */
	instance() {
		return new Log();
	}
}

export default new Log();