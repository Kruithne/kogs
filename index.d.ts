import { Readable } from 'stream';

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
 * @returns {Promise<stream.Readable>}
 */
export function arrayToStream(input: any[], objectMode?: boolean): Promise<Readable>;

/**
 * Consumes a stream and returns an array of its contents.
 * @param {stream.Readable} input 
 * @returns {Promise<Array>}
 */
export function streamToArray(input: Readable): Promise<any[]>;

/**
 * Consumes a stream and returns a buffer of its contents.
 * @param {stream.Readable} input 
 * @returns {Promise<Buffer>}
 */
export function streamToBuffer(input: Readable): Promise<Buffer>;
  