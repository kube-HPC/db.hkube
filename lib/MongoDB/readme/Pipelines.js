const Collection = require('../Collection');
const collections = require('../../const/collections');

class Pipelines extends Collection {
    constructor(db, client) {
        super(db, client, collections.Readme.Pipelines);
    }

    async create(pipeline) {
        return super.create(pipeline);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async update(readme) {
        const { name } = readme;
        await super.updateOne({
            filter: { name },
            query: { $set: readme },
        });
        return readme;
    }

    async patch(readme) {
        const { name } = readme;
        const entry = await super.patch({
            query: { name },
            data: readme,
        });
        return entry;
    }

    async fetchAll({ query, fields, sort, limit } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Pipelines;
