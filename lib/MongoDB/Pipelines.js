const Collection = require('./Collection');
const collections = require('./collections');
/** @typedef {import('./../Pipeline.d').Pipeline} Pipeline */

/** @augments {Collection<Pipeline>} */
class Pipelines extends Collection {
    constructor(db, client) {
        super(db, client, collections.Pipelines);
    }

    /** @param {Pipeline} pipeline */
    async create(pipeline, options) {
        return super.create(pipeline, options);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    /**
     * @param {Pipeline} pipeline
     * @returns {Promise<Pipeline>}
     */
    async update(pipeline) {
        const { name } = pipeline;
        await super.updateOne({
            filter: { name },
            query: { $set: pipeline },
        });
        return pipeline;
    }

    async patch(pipeline) {
        const entry = await super.patch({
            query: { name: pipeline.name },
            data: pipeline,
        });
        return entry;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Pipelines;
