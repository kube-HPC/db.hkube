const Collection = require('../Collection');
const collections = require('../collections');
const Query = require('../Query');

class Builds extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms.Builds);
    }

    async create(build) {
        return super.create(build);
    }

    async fetch({ buildId }) {
        const entry = await super.fetch({ buildId }, { excludeId: true });
        return entry;
    }

    async search({
        statuses,
        algorithmName,
        fields = {},
        sort = null,
        limit = 0,
    }) {
        const query = new Query()
            .addInArray('status', statuses)
            .addParam('algorithmName', algorithmName)
            .create();

        const entries = await super.fetchAll({
            query,
            sort,
            limit,
            fields,
            excludeId: true,
        });
        return entries;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({
            query,
            fields,
            sort,
            limit,
            excludeId: true,
        });
        return list;
    }

    async update(build) {
        await super.updateOne({
            filter: { buildId: build.buildId },
            query: { $set: build },
            upsert: true,
        });
        return build;
    }

    async patch(build) {
        const entry = await super.patch({
            query: { buildId: build.buildId },
            data: build,
        });
        return entry;
    }

    async delete({ buildId }) {
        const result = await super.delete({ buildId });
        return result;
    }

    async deleteAll({ algorithmName }, { allowNotFound = true } = {}) {
        const result = await super.deleteMany(
            { algorithmName },
            { allowNotFound }
        );
        return result;
    }
}

module.exports = Builds;
