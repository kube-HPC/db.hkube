const Collection = require('../Collection');
const collections = require('../../const/collections');
const { itemNotFound } = require('../../errors');

class Builds extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms);
    }

    async create(build) {
        const { algorithmName } = build;
        await super.updateOne({
            filter: { name: algorithmName },
            query: { $push: { builds: build } },
        });
    }

    /**
     * Return a specific algorithm build.
     *
     * @param {object} options
     * @param {string} options.name
     * @param {string} options.buildId
     * @returns {Promise<Build>}
     */
    async fetch({ name, buildId }) {
        const entry = await super.fetch(
            { name },
            { included: { builds: { $elemMatch: { buildId } } }, excludeId: true }
        );
        const result = entry?.builds?.[0];
        if (!result) {
            throw itemNotFound(collections.Builds.name, buildId);
        }
        return result;
    }

    /**
     * Return algorithm builds list.
     *
     * @param {object} options
     * @param {string} options.name
     * @returns {Promise<Version>}
     */
    async getAll({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry.builds || [];
    }

    // TODO: update some props
    async update(build) {
        const { buildId, algorithmName } = build;
        await super.updateOne({
            filter: {
                name: algorithmName,
                builds: { $elemMatch: { buildId } },
            },
            query: {
                $set: {
                    'builds.$.status': build.status,
                },
            },
        });
        return buildId;
    }

    /**
     * Delete a specific algorithm build.
     *
     * @param {object} options
     * @param {string} options.name
     * @param {string} options.buildId
     * @returns {Promise<Version>}
     */
    async delete({ name, buildId }) {
        const result = await super.updateOne({
            filter: { name },
            query: {
                $pull: { builds: { buildId } },
            },
        });
        return result;
    }
}

module.exports = Builds;
