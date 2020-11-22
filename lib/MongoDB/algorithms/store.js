const Collection = require('../Collection');

/**
 * @typedef {import('./../Algorithm').AlgorithmsInterface} AlgorithmsInterface
 * @typedef {import('../Algorithm').Algorithm} Algorithm
 */

/**
 * @augments {Collection<Algorithm>}
 * @implements {AlgorithmsInterface}
 */

class Algorithms extends Collection {
    async init() {
        await super.createUniqueIndex();
    }

    async create(algorithm) {
        return super.create(algorithm);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { _id: 0 });
        return entry;
    }

    async update(algorithm) {
        const { name } = algorithm;
        await super.updateOne({ name }, { $set: algorithm });
        return name;
    }

    async delete(algorithm) {
        const result = await super.delete(algorithm);
        return result;
    }

    async fetchAll(options, { excluded, included } = {}) {
        return super.fetchAll(options, { excluded, included, _id: 0 });
    }
}

module.exports = Algorithms;
