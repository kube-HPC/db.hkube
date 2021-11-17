const Collection = require('./Collection');
const collections = require('./collections');
const Query = require('./Query');

class Devenvs extends Collection {
    constructor(db, client) {
        super(db, client, collections.Devenvs);
    }

    async create(options) {
        return super.create(options);
    }

    async fetch({ name }) {
        const entry = await super.fetch(
            { name },
            {
                queryInnerId: false,
                excludeId: true,
            }
        );
        return entry;
    }

    async search({ status, fields = {}, sort = null, limit = 0 }) {
        const query = new Query().addParam('status', status).create();
        const entries = await super.fetchAll({
            query,
            sort,
            limit,
            fields,
            excludeId: true,
        });
        return entries;
    }

    async update(options) {
        const { name } = options;
        await super.updateOne({
            filter: { name },
            query: { $set: options },
        });
        return options;
    }

    async patch(options) {
        const { name } = options;
        const entry = await super.patch({
            query: { name },
            data: options,
        });
        return entry;
    }

    async delete({ name }) {
        const result = await super.delete(
            { name },
            { queryInnerId: false, allowNotFound: true }
        );
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

module.exports = Devenvs;
