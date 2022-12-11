import argv from './index.mjs';

const test = argv.parse({
	'--fudge': {
		
	}
});

console.log(test);
console.log(test._);