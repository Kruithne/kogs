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
function isValidOptName(name) {
	// Name must be in a-z, A-Z, 0-9, or - range, but must begin with a-z, A-Z.
	return /^[a-zA-Z][a-zA-Z0-9-]*$/.test(name);
}

/**
 * Render an option name in a human-readable format.
 * @param {string} name 
 * @param {object} opt 
 * @returns {string}
 */
function renderOptionName(name, opt) {
	if (opt.allow !== undefined)
		return name + '=<' + opt.allow.join('|') + '>';

	if (opt.type !== undefined)
		return name + '=<' + opt.type + '>';

	return name;
}

/**
 * Parse command line arguments.
 * @param {object} manifest - The manifest of options.
 * @param {string[]} args - The arguments to parse.
 * @return {object} The parsed arguments.
 */
function parse(manifest, args) {
	if (args === undefined)
		args = process.argv.slice(2); // Remove node executable and script name.
	else if (!Array.isArray(args))
		throw new Error('argv.parse() expects {args} to be an argument array');

	const parsed = {};
	const positional = [];

	while (args.length > 0) {
		const arg = args.shift();
		
		if (isLongOpt(arg)) {
			const equalsIndex = arg.indexOf('=');

			if (equalsIndex === -1) {
				const cleanArgName = arg.slice(2);

				if (!isValidOptName(cleanArgName))
					throw new Error('Invalid long option name {' + arg + '}');

				if (args.length > 0 && !isOpt(args[0]) && manifest?.[cleanArgName]?.type !== 'boolean') {
					// Long-option without a value, but next value can be used as the value.
					parsed[cleanArgName] = args.shift();
				} else {
					// Long-option without a value, and no next value.
					parsed[cleanArgName] = true;
				}
			} else {
				const cleanArgName = arg.slice(2, equalsIndex);

				if (!isValidOptName(cleanArgName))
					throw new Error('Invalid long option name {' + arg + '}');

				// Long-option with an affixed value (e.g. --include-condiment=mayo)
				parsed[cleanArgName] = arg.slice(equalsIndex + 1);
			}
		} else if (isShortOpt(arg)) {
			// Parse short option groups (e.g. -abc)
			for (let i = 1; i < arg.length; i++) {
				const flag = arg[i];
				if (!/[a-zA-Z]/.test(flag))
					throw new Error('Invalid character {' + flag + '} in flag group {' + arg + '}');

				// If the flag is the last character in the group, and the next argument is not a flag, use it as the value.
				if (i === arg.length - 1 && args.length > 0 && !isOpt(args[0]) && manifest?.[flag]?.type !== 'boolean')
					parsed[flag] = args.shift();
				else
					parsed[flag] = true;
			}
		} else {
			// Positional argument.
			positional.push(arg);
		}
	}

	// Check if unknown arguments were provided. This needs to be done before we insert
	// the positional arguments into the parsed object, because they are not required.
	if (manifest !== undefined)
		for (const name of Object.keys(parsed))
			if (!manifest.hasOwnProperty(name))
				throw new Error('Unknown option {' + name + '} provided');

	if (positional.length > 0) {
		// Create a non-enumerable property on the parsed object to store the positional arguments.
		Object.defineProperty(parsed, '_', {
			value: positional,
			enumerable: false
		});

		// Insert the positional arguments into the parsed object for quick access.
		for (let i = 0, n = positional.length; i < n; i++)
			parsed[i] = positional[i];
	}

	if (manifest !== undefined) {
		if (manifest !== null && typeof manifest !== 'object')
			throw new Error('argv.parse() expects to be provided an object as its second argument');

		// Validate the manifest provided.
		for (const [name, opt] of Object.entries(manifest)) {
			if (typeof opt !== 'object')
				throw new Error('Invalid manifest entry {' + name + '}: Manifest entries must be an object.');

			// If opt.type is provided, it must be one of 'boolean', 'string', 'int' or 'float'.
			if (opt.type !== undefined && !['boolean', 'string', 'int', 'float'].includes(opt.type))
				throw new Error('Invalid manifest entry {' + name + '}: Invalid type {' + opt.type + '}, must be one of "boolean", "string", "int" or "float".');

			// If opt.default is provided, it must be of the same type as opt.type.
			if (opt.default !== undefined && opt.type !== undefined && typeof opt.default !== opt.type)
				throw new Error('Invalid manifest entry {' + name + '}: Default value {' + opt.default + '} is not of type {' + opt.type + '}.');

			if (opt.allow !== undefined) {
				// If opt.allow is defined, it must be an array.
				if (!Array.isArray(opt.allow) || opt.allow.length === 0)
					throw new Error('Invalid manifest entry {' + name + '}: Allow list must be an array containing at least one item.');

				if (opt.type !== undefined) {
					// If opt.type is defined, it cannot be boolean.
					if (opt.type === 'boolean')
						throw new Error('Invalid manifest entry {' + name + '}: Allow list cannot be used with boolean options.');

					// Otherwise, all values in the allow list must be of the same type as opt.type.
					const expectedType = opt.type === 'string' ? 'string' : 'number';
					for (const value of opt.allow)
						if (typeof value !== expectedType)
							throw new Error('Invalid manifest entry {' + name + '}: Allow list contains invalid value {' + value + '}, must be of type {' + expectedType + '}.');
				}

				// If opt.default is set, it must be in the allow list.
				if (opt.default !== undefined && !opt.allow.includes(opt.default))
					throw new Error('Invalid manifest entry {' + name + '}: Default value {' + opt.default + '} is not in the allow list.');
			}
		}

		for (const [name, opt] of Object.entries(manifest)) {
			const rawValue = parsed[name];
			let value = rawValue;
		
			if (value !== undefined) {
				// Type checking/casting.
				if (opt.type !== undefined) {
					if (opt.type === 'boolean' || opt.type === 'string') {
						if (typeof value !== opt.type)
							throw new Error('Invalid value {' + value + '} for argument {' + renderOptionName(name, opt) + '}');
					} else {
						if (opt.type === 'int')
							value = parseInt(value);
						else if (opt.type === 'float')
							value = parseFloat(value);

						if (typeof value !== 'number' || isNaN(value))
							throw new Error('Invalid value {' + rawValue + '} for argument {' + renderOptionName(name, opt) + '}');
					}
				}

				// Value whitelist check.
				if (opt.allow !== undefined && !opt.allow.includes(value))
					throw new Error('Invalid value {' + value + '} for argument {' + renderOptionName(name, opt) + '}');

				parsed[name] = value;
			} else {
				if (opt.default !== undefined)
					parsed[name] = opt.default;
				else if (opt.required)
					throw new Error('Required option {' + renderOptionName(name, opt) + '} not provided');
			}
		}
	}

	return parsed;
}

export default { parse };
export { parse };