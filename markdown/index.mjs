/**
 * @param {array|object} optionsOrData
 * @param {array} optionsOrData.data
 * @param {array} optionsOrData.headers
 * @param {boolean} optionsOrData.minimalOutput
 * @param {string} optionsOrData.delimiter
 * @returns {string}
 */
export default (optionsOrData) => {
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