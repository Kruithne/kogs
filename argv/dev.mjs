import argv from './index.mjs';

const manifest = {
	0: {
		type: 'string',
		required: true,
		allow: ['foo', 'bar', 'baz']
	}
};

const parsed = argv.parse(manifest);