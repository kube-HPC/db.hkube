const Collection = require('./Collection');
const collections = require('./collections');

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
