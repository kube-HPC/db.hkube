const Collection = require('../Collection');
const collections = require('../../const/collections');
const { itemNotFound } = require('../../errors');

class Versions extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms);
    }

    async create(version) {
        const { name } = version;
        await super.updateOne({
            filter: { name },
            query: { $push: { versions: version } },
        });
    }

    /**
     * Return a specific algorithm version.
     *
     * @param {object} options
     * @param {string} options.name
     * @param {string} options.version
     * @returns {Promise<Version>}
     */
    async fetch({ name, version }) {
        const entry = await super.fetch(
            { name },
            { included: { versions: { $elemMatch: { version } } }, excludeId: true }
        );
        const result = entry?.versions?.[0];
        if (!result) {
            throw itemNotFound(collections.Versions.name, version);
        }
        return result;
    }

    /**
     * Return algorithm versions list.
     *
     * @param {object} options
     * @param {string} options.name
     * @returns {Promise<Version>}
     */
    async getList({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry.versions || [];
    }

    // TODO: update all props
    async update(options) {
        const { name, version, ...params } = options;
        const res = await super.updateOne({
            filter: { name, versions: { $elemMatch: { version } } },
            query: {
                $set: {
                    'versions.$.tags': params.tags,
                    'versions.$.pinned': params.pinned,
                },
            },
        });
        return res;
    }

    /**
     * Delete a specific algorithm version.
     *
     * @param {object} options
     * @param {string} options.name
     * @param {string} options.version
     * @returns {Promise<Version>}
     */
    async delete({ name, version }) {
        const result = await super.updateOne({
            filter: { name },
            query: {
                $pull: { versions: { version } },
            },
        });
        const { matchedCount, modifiedCount } = result;
        if (!matchedCount) {
            throw itemNotFound(this.entityName, name);
        }
        if (!modifiedCount) {
            throw itemNotFound(collections.Versions.name, version);
        }
        return { deleted: modifiedCount };
    }
}

module.exports = Versions;
