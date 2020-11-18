const Collection = require('./Collection');
const { stripId } = require('./Collection');
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

    async create(job) {
        return super.create(job);
    }

    async update(algorithm) {
        const { name } = algorithm;
        await this.collection.updateOne(
            { name },
            { $set: algorithm },
            { upsert: true }
        );
        return name;
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name });
        const { id, ...data } = entry;
        return data;
    }

    async fetchAll() {
        return this.collection
            .find({})
            .map(entry => super[stripId](entry))
            .toArray();
    }
}

module.exports = Pipelines;
