const Collection = require('./Collection');
/**
 * @typedef {import('./../Algorithm').AlgorithmsInterface} AlgorithmsInterface
 * @typedef {import('../Algorithm').Algorithm} Algorithm
 */

/**
 * @augments {Collection<Algorithm>}
 * @implements {AlgorithmsInterface}
 */
class Algorithms extends Collection {}

module.exports = Algorithms;
