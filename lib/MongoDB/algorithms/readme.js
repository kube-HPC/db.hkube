const Collection = require('../Collection');
const collections = require('../collections');

class Readme extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms.Readme);
    }

    async create(readme) {
        return super.create(readme);
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
            upsert: true,
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

module.exports = Readme;
