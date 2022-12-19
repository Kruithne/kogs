import { Readable, Transform, PassThrough } from 'stream';

export interface Test {
	_testID: number;
	_nPassedTests: number;
	_nFailedTests: number;
	_promises: Promise<void>[];
  
	/**
	 * Run a test.
	 * @param {function} fn 
	 * @param {string} [name]
	 * @return {Promise}
	 */
	run(fn: () => any, name?: string): Promise<void>;
  
	/**
	 * Prints the results of tests and resets internal
	 * state for the next batch of test runs.
	 * @return {Promise}
	 */
	results(): Promise<void>;
  
	/**
	 * Captures input written to stdout/stderr and writes them into
	 * the arrays provided to fn. Functionality is restored once fn
	 * resolves.
	 * @param {function} fn 
	 * @return { Promise<{ stdout: string[], stderr: string[] }> }
	 */
	capture(fn: () => any): Promise<{ stdout: string[], stderr: string[] }>;
}
  
export const test: Test;

/**
 * Creates a readable stream and pushes the given array into it.
 * @param {Array} input 
 * @param {boolean} [objectMode]
 * @returns {Promise<Readable>}
 */
export function arrayToStream(input: any[], objectMode?: boolean): Promise<Readable>;

/**
 * Consumes a stream and returns an array of its contents.
 * @param {Readable} input 
 * @returns {Promise<Array>}
 */
export function streamToArray(input: Readable): Promise<any[]>;

/**
 * Consumes a stream and returns a buffer of its contents.
 * @param {Readable} input 
 * @returns {Promise<Buffer>}
 */
export function streamToBuffer(input: Readable): Promise<Buffer>;

/**
 * Provides a stream.Transform that filters out chunks that
 * do not pass the given filteirng function.
 * @param {function} fn 
 * @returns {Transform}
 */
export function filterStream(fn: (chunk: any) => Promise<boolean>): Transform;

/**
 * Consumes multiple streams and merges them into one.
 * @param  {...Readable} streams 
 * @returns {PassThrough}
 */
export function mergeStreams(...streams: Array<Readable>): PassThrough;

/**
 * Renders a table in Markdown format.
 * @param {array|object} optionsOrData
 * @param {array} optionsOrData.data
 * @param {array} optionsOrData.headers
 * @param {boolean} optionsOrData.minimalOutput
 * @param {string} optionsOrData.delimiter
 * @returns {string}
 */
export function renderMarkdown(optionsOrData: Array<any> | { data: Array<any>, headers: Array<string>, minimalOutput: boolean, delimiter: string }): string;