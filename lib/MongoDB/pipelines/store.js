const Collection = require('../Collection');
const collections = require('../collections');
const Readme = require('./readme');
/** @typedef {import('../../Pipeline').Pipeline} Pipeline */

/** @augments {Collection<Pipeline>} */
class Pipelines extends Collection {
    constructor(db, client) {
        super(db, client, collections.Pipelines.Store);
        this.readme = new Readme(db, client);
    }

    async init() {
        await super.init();
        await this.readme.init();
    }

    /**
     * @param {Pipeline} pipeline
     * @param {object} options
     */
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

    async delete({ name }) {
        const { deleted } = await super.delete({ name });
        const { deleted: readme } = await this.readme.delete({ name });
        return { deleted: deleted + readme };
    }

    async deleteMany({ names }) {
        const { deleted } = await super.deleteMany(
            { name: { $in: names } },
            { allowNotFound: true }
        );
        return { deleted };
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Pipelines;
