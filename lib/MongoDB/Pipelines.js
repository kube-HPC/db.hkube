const Collection = require('./Collection');
/**
 * @typedef {import('../Pipeline').PipelinesInterface} PipelinesInterface
 * @typedef {import('../Pipeline').Pipeline} Pipeline
 */

/**
 * @augments {Collection<Pipeline>}
 * @implements {PipelinesInterface}
 */

class Pipelines extends Collection {
    async init() {
        await super.createUniqueIndex();
    }

    async create(pipeline) {
        return super.create(pipeline);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { _id: 0 });
        return entry;
    }

    async update(pipeline) {
        const { name } = pipeline;
        await super.updateOne({ name }, { $set: pipeline });
        return name;
    }

    async fetchAll(options) {
        return super.fetchAll(options, { _id: 0 });
    }
}

module.exports = Pipelines;
