const Collection = require('./Collection');
const collections = require('./collections');

class Experiments extends Collection {
    constructor(db, client) {
        super(db, client, collections.Experiments);
    }

    async create(experiment) {
        return super.create(experiment);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async update(experiment) {
        await super.updateOne({
            filter: { name: experiment.name },
            query: { $set: experiment },
        });
        return experiment;
    }

    async delete({ name }) {
        const result = await super.delete({ name });
        return result;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Experiments;
