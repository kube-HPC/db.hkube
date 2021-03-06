const Collection = require('../Collection');
const collections = require('../collections');
const Query = require('../Query');

class Versions extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms.Versions);
    }

    async create(version) {
        return super.create(version);
    }

    /**
     * Fetch a specific algorithm version.
     *
     * @param {object} options
     * @param {string} options.version
     * @returns {Promise<Version>}
     */
    async fetch({ version }) {
        const entry = await super.fetch({ version }, { excludeId: true });
        return entry;
    }

    async search({ name, fields = {}, sort = null, limit = 0 }) {
        const query = new Query().addParam('name', name).create();

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

    async update(version) {
        await super.updateOne({
            filter: { version: version.version },
            query: { $set: version },
        });
        return version;
    }

    async patch(version) {
        const entry = await super.patch({
            query: { version: version.version },
            data: version,
        });
        return entry;
    }

    /**
     * Delete a specific algorithm version.
     *
     * @param {object} options
     * @param {string} options.version
     * @returns {Promise<{ deleted: number }>}
     */
    async delete({ version }) {
        const result = await super.delete({ version });
        return result;
    }

    /**
     * Delete a algorithm versions.
     *
     * @param {object} options
     * @param {string} options.name
     * @returns {Promise<{ deleted: number }>}
     */
    async deleteAll({ name }, { allowNotFound = true } = {}) {
        const result = await super.deleteMany({ name }, { allowNotFound });
        return result;
    }
}

module.exports = Versions;
