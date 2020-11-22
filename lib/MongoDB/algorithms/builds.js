const Collection = require('../Collection');

class Builds extends Collection {
    async create(build) {
        const { algorithmName } = build;
        await super.updateOne(
            { name: algorithmName },
            { $push: { builds: build } }
        );
    }

    async fetch(build) {
        const { buildId, algorithmName } = build;
        const entry = await super.fetch(
            { name: algorithmName },
            { builds: { $elemMatch: { buildId } }, _id: 0 }
        );
        return entry?.builds?.[0] || [];
    }

    // TODO: update some props
    async update(build) {
        const { buildId, algorithmName } = build;
        await super.updateOne(
            { name: algorithmName, builds: { $elemMatch: { buildId } } },
            {
                $set: {
                    'builds.$.status': build.status,
                },
            }
        );
        return buildId;
    }

    // TODO: delete item from array
    async delete(build) {
        const { buildId, algorithmName } = build;
        const result = await super.delete({ buildId, algorithmName });
        return result;
    }

    async fetchAll(options) {
        return super.fetchAll(options);
    }
}

module.exports = Builds;
