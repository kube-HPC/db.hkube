const Collection = require('../Collection');
const Versions = require('./versions');
const Builds = require('./builds');
const collections = require('../../const/collections');

/**
 * @typedef {import('./../Algorithm').AlgorithmsInterface} AlgorithmsInterface
 * @typedef {import('../Algorithm').Algorithm} Algorithm
 */

/**
 * @augments {Collection<Algorithm>}
 * @implements {AlgorithmsInterface}
 */

class Algorithms extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms);
        this.versions = new Versions(db, client);
        this.builds = new Builds(db, client);
    }

    async create(algorithm) {
        return super.create(algorithm);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async update(algorithm) {
        const { name } = algorithm;
        await super.updateOne({
            filter: { name },
            query: { $set: algorithm },
        });
        return name;
    }

    async delete(algorithm) {
        const result = await super.delete(algorithm);
        return result;
    }

    async fetchAll({ query, excluded, included, sort, limit } = {}) {
        return super.fetchAll({
            query,
            excludeId: true,
            excluded,
            included,
            sort,
            limit,
        });
    }
}

module.exports = Algorithms;
