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
        const { name, ...rest } = experiment;
        await super.updateOne({
            filter: { name },
            query: { $set: rest },
        });
        return name;
    }

    async delete(algorithm) {
        const result = await super.delete(algorithm);
        return result;
    }

    async fetchAll({ query, excluded, included, sort, limit } = {}) {
        return super.fetchAll({
            query,
            excludeId: true,
            excluded,
            included,
            sort,
            limit,
        });
    }
}

module.exports = Experiments;
