'use strict';

/**
 * Returns true if the argument is an option.
 * @param {string} arg 
 * @returns {boolean}
 */
function isOpt(arg) {
	return arg.startsWith('-');
}

/**
 * Returns true if the argument is a long option.
 * Example: --include-condiment=mayo
 * @param {string} arg 
 * @returns {boolean}
 */
function isLongOpt(arg) {
	return arg.startsWith('--');
}

/**
 * Returns true if the argument is a short option.
 * @param {string} arg 
 * @returns {boolean}
 */
function isShortOpt(arg) {
	return isOpt(arg) && !isLongOpt(arg);
}

/**
 * Returns true if the given argument name is reserved.
 * @param {string} name 
 * @returns {boolean}
 */
function isReservedOptName(name) {
	return name === '_';
}

/**
 * Parse command line arguments.
 * @param {string[]} args - The arguments to parse.
 * @return {object} The parsed arguments.
 */
function parse(args) {
	if (args === undefined)
		args = process.argv.slice(2); // Remove node executable and script name.
	else if (!Array.isArray(args))
		throw new Error('argv.parse() expects to be provided an array of strings as its first argument');

	const parsed = {};
	const positional = [];
	let argIndex = 0;

	while (args.length > 0) {
		const arg = args.shift();
		
		if (isLongOpt(arg)) {
			const equalsIndex = arg.indexOf('=');

			if (equalsIndex === -1) {
				const argName = arg.slice(2);

				if (isReservedOptName(argName))
					throw new Error('Invalid long-option: {' + arg + '}');

				if (args.length > 0 && !isOpt(args[0])) {
					// Long-option without a value, but next value can be used as the value.
					parsed[argName] = args.shift();
				} else {
					// Long-option without a value, and no next value.
					parsed[argName] = true;
				}
			} else {
				// Long-option with an affixed value (e.g. --include-condiment=mayo)
				parsed[arg.slice(2, equalsIndex)] = arg.slice(equalsIndex + 1);
			}
		} else if (isShortOpt(arg)) {
			// Parse short option groups (e.g. -abc)
			for (let i = 1; i < arg.length; i++) {
				const flag = arg[i];
				if (!/[a-zA-Z]/.test(flag))
					throw new Error('Invalid character {' + flag + '} in flag group {' + arg + '}');

				// If the flag is the last character in the group, and the next argument is not a flag, use it as the value.
				if (i === arg.length - 1 && args.length > 0 && !isOpt(args[0]))
					parsed[flag] = args.shift();
				else
					parsed[flag] = true;
			}
		} else {
			// Positional argument.
			parsed[argIndex++] = arg;
			positional.push(arg);
		}
	}

	if (positional.length > 0) {
		Object.defineProperty(parsed, '_', {
			value: positional,
			enumerable: false
		});
	}

	return parsed;
}

export default { parse };
export { parse };