const Collection = require('../Collection');
const Versions = require('./versions');
const Builds = require('./builds');
const Readme = require('./readme');
const collections = require('../collections');
/** @typedef {import('./../../Algorithm').Algorithm} Algorithm */

/** @augments {Collection<Algorithm>} */
class Algorithms extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms.Store);
        this.versions = new Versions(db, client);
        this.builds = new Builds(db, client);
        this.readme = new Readme(db, client);
    }

    async init() {
        await super.init();
        await this.versions.init();
        await this.builds.init();
        await this.readme.init();
    }

    /** @param {Algorithm} algorithm */
    async create(algorithm) {
        return super.create(algorithm);
    }

    /**
     * Fetch algorithm by name
     *
     * @param {object} options
     * @param {string} options.name
     * @returns {Promise<Algorithm>}
     */
    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async fetchMany({ names }) {
        const entry = await super.fetchMany({ names }, { excludeId: true });
        return entry;
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

    async fetchAllByName({ name, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({
            query: { name: { $regex: `^${name}.*` } },
            fields,
            sort,
            limit,
            excludeId: true,
        });
        return list;
    }

    /**
     * @param {Algorithm} algorithm
     * @returns {Promise<Algorithm>}
     */
    async update(algorithm) {
        await super.updateOne({
            filter: { name: algorithm.name },
            query: { $set: algorithm },
            upsert: true,
        });
        return algorithm;
    }

    /**
     * @param {Algorithm} algorithm
     * @returns {Promise<Algorithm>}
     */
    async patch(algorithm) {
        const entry = await super.patch({
            query: { name: algorithm.name },
            data: algorithm,
        });
        return entry;
    }

    /**
     * @param {object} options
     * @param {string} options.name
     * @returns {Promise<{ deleted: number }>}
     */
    async delete({ name }) {
        const { deleted: algorithms } = await super.delete({ name });
        const { deleted: versions } = await this.versions.deleteAll({ name });
        const { deleted: builds } = await this.builds.deleteAll({ algorithmName: name });
        const { deleted: readme } = await this.readme.delete({ name });
        return { algorithms, versions, builds, readme };
    }
}

module.exports = Algorithms;
