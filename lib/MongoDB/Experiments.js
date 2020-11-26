const Collection = require('./Collection');
const collections = require('../const/collections');

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

    async delete(algorithm) {
        const result = await super.delete(algorithm);
        return result;
    }

    async fetchAll({ query, fields, sort, limit } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Experiments;
