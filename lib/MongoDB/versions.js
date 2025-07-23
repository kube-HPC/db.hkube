const Collection = require('./Collection');
const Query = require('./Query');
const { itemNotFound } = require('../errors');

class Versions extends Collection {
    // eslint-disable-next-line no-useless-constructor
    constructor(db, client, collections) {
        super(db, client, collections);
        this.entityName = collections.entityName;
    }

    async create(version) {
        return super.create(version);
    }

    /**
     * Fetch a specific algorithm/pipeline version.
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
        const result = await super.updateOne({
            filter: { version: version.version },
            query: { $set: version },
        });
        if (result.matchedCount === 0) {
            throw itemNotFound(this.entityName, version.version);
        }
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
     * Delete a specific algorithm/pipeline version.
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
     * Delete a algorithm/piepline versions.
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
