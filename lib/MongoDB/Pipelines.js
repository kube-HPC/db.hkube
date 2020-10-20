const Collection = require('./Collection');
/**
 * @typedef {import('../Pipeline').PipelinesInterface} PipelinesInterface
 * @typedef {import('../Pipeline').Pipeline} Pipeline
 */

/**
 * @augments {Collection<Pipeline>}
 * @implements {PipelinesInterface}
 */
class Pipelines extends Collection {}

module.exports = Pipelines;
