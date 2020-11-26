const Collection = require('./Collection');
const collections = require('../const/collections');

class Pipelines extends Collection {
    constructor(db, client) {
        super(db, client, collections.Pipelines);
    }

    async create(pipeline) {
        return super.create(pipeline);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

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

    async fetchAll({ query, fields, sort, limit } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Pipelines;
