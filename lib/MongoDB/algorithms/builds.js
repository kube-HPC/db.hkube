const Collection = require('../Collection');
const collections = require('../collections');
/** @typedef {import('./../../Algorithm.d').Build} Build */

/** @augments {Collection<Build>} */
class Builds extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms.Builds);
    }

    async create(build) {
        return super.create(build);
    }

    /**
     * Return a specific algorithm build.
     *
     * @param {object} options
     * @param {string} options.buildId
     * @returns {Promise<Build>}
     */
    async fetch({ buildId }) {
        const entry = await super.fetch({ buildId }, { excludeId: true });
        return entry;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }

    async update(build) {
        await super.updateOne({
            filter: { buildId: build.buildId },
            query: { $set: build },
            upsert: true,
        });
        return build;
    }

    async patch(build) {
        const entry = await super.patch({
            query: { buildId: build.buildId },
            data: build,
        });
        return entry;
    }

    /**
     * Delete a specific algorithm build.
     *
     * @param {object} options
     * @param {string} options.buildId
     * @returns {Promise<{ deleted: number }>}
     */
    async delete({ buildId }) {
        const result = await super.delete({ buildId });
        return result;
    }

    /**
     * Delete a algorithm builds.
     *
     * @param {object} options
     * @param {string} options.algorithmName
     * @returns {Promise<{ deleted: number }>}
     */
    async deleteAll({ algorithmName }, { allowNotFound = true } = {}) {
        const result = await super.deleteMany({ algorithmName }, { allowNotFound });
        return result;
    }
}

module.exports = Builds;
