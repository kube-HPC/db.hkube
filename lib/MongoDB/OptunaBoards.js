const Collection = require('./Collection');
const collections = require('./collections');
const Query = require('./Query');

class OptunaBoards extends Collection {
    constructor(db, client) {
        super(db, client, collections.OptunaBoards);
    }

    async create(optunaBoards) {
        return super.create(optunaBoards);
    }

    async fetch({ id }) {
        const entry = await super.fetch(
            { id },
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

    async update(optunaBoards) {
        const { id } = optunaBoards;
        await super.updateOne({
            filter: { id },
            query: { $set: optunaBoards },
        });
        return optunaBoards;
    }

    async patch(optunaBoards) {
        const entry = await super.patch({
            query: { id: optunaBoards.id },
            data: optunaBoards,
        });
        return entry;
    }

    async delete({ id }) {
        const result = await super.delete(
            { id },
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

module.exports = OptunaBoards;
