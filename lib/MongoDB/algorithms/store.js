const Collection = require('../Collection');
const Versions = require('./versions');
const Builds = require('./builds');
const collections = require('../collections');

class Algorithms extends Collection {
    constructor(db, client) {
        super(db, client, collections.Algorithms.Store);
        this.versions = new Versions(db, client);
        this.builds = new Builds(db, client);
    }

    async init() {
        super.init();
        await this.versions.init();
        await this.builds.init();
    }

    async create(algorithm) {
        return super.create(algorithm);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    /**
     * Return algorithm list.
     *
     * @param {object} options
     * @param {string} options.query
     * @param {string} options.fields
     * @param {string} options.sort
     * @param {string} options.limit
     * @returns {Promise<Version>}
     */
    async fetchAll({ query, fields, sort, limit } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }

    async update(algorithm) {
        await super.updateOne({
            filter: { name: algorithm.name },
            query: { $set: algorithm },
        });
        return algorithm;
    }

    async patch(algorithm) {
        const entry = await super.patch({
            query: { name: algorithm.name },
            data: algorithm,
        });
        return entry;
    }

    async delete({ name }) {
        const { deleted } = await super.delete({ name });
        const { deleted: versions } = await this.versions.deleteAll({ name });
        const { deleted: builds } = await this.builds.deleteAll({ algorithmName: name });
        return { deleted: deleted + versions + builds };
    }
}

module.exports = Algorithms;
