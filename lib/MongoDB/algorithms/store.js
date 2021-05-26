const Collection = require('../Collection');
const Versions = require('./versions');
const Builds = require('./builds');
const Readme = require('./readme');
const collections = require('../collections');
const Query = require('../Query');

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

    async create(algorithm) {
        return super.create(algorithm);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async fetchMany({ names }) {
        const entry = await super.fetchMany({ names }, { excludeId: true });
        return entry;
    }

    async search({
        isDebug = undefined,
        isPending = undefined,
        hasImage = undefined,
        name,
        kind,
        names = null,
        fields = {},
        sort = null,
        limit = 0,
    } = {}) {
        const query = new Query()
            .addParam('options.debug', isDebug)
            .addParam('options.pending', isPending)
            .addParam('kind', kind)
            .addExists({ algorithmImage: hasImage })
            .addRegexSearch('name', name)
            .addInArray('name', names)
            .create();

        const list = await super.fetchAll({
            query,
            fields,
            sort,
            limit,
            excludeId: true,
        });
        return list;
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

    async update(algorithm) {
        await super.updateOne({
            filter: { name: algorithm.name },
            query: { $set: algorithm },
            upsert: true,
        });
        return algorithm;
    }

    async replace(algorithm) {
        await super.replaceOne({
            filter: { name: algorithm.name },
            replacement: algorithm,
            upsert: true,
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
        const { deleted: algorithms } = await super.delete({ name });
        const { deleted: versions } = await this.versions.deleteAll({ name });
        const { deleted: builds } = await this.builds.deleteAll({
            algorithmName: name,
        });
        const { deleted: readme } = await this.readme.delete({ name });
        return { algorithms, versions, builds, readme };
    }
}

module.exports = Algorithms;
