const Collection = require('./Collection');
const collections = require('./collections');
const Query = require('./Query');

class Gateways extends Collection {
    constructor(db, client) {
        super(db, client, collections.Gateways);
    }

    async create(gateway) {
        return super.create(gateway);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async update(gateway) {
        await super.updateOne({
            filter: { name: gateway.name },
            query: { $set: gateway },
        });
        return gateway;
    }

    async delete({ name }) {
        const result = await super.delete({ name });
        return result;
    }

    async deleteByJob({ jobId }, { allowNotFound = true } = {}) {
        const result = await super.delete({ jobId }, { allowNotFound });
        return result;
    }

    async search({
        jobId,
        nodeName,
        name,
        fields = {},
        sort = null,
        limit = 0,
    }) {
        const query = new Query()
            .addParam('jobId', jobId)
            .addParam('nodeName', nodeName)
            .addParam('name', name)
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
}

module.exports = Gateways;
