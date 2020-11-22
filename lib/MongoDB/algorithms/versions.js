const Collection = require('../Collection');

class Versions extends Collection {
    async create(version) {
        const { name } = version;
        await super.updateOne({ name }, { $push: { versions: version } });
    }

    async fetch(options) {
        const { name, version } = options;
        const entry = await super.fetch(
            { name, version },
            { versions: { $elemMatch: { version } }, _id: 0 }
        );
        return entry?.versions?.[0] || [];
    }

    async fetchAll(options) {
        const { name } = options;
        const entry = await super.fetchAll({ name }, { _id: 0 });
        return entry.versions || [];
    }

    // TODO: update some props
    async update(options) {
        const { name, version, ...params } = options;
        const res = await super.updateOne(
            { name, versions: { $elemMatch: { version } } },
            {
                $set: {
                    'versions.$.tags': params.tags,
                    'versions.$.pinned': params.pinned,
                },
            }
        );
        return res;
    }

    // TODO: delete item from array
    async delete(options) {
        const { name, version } = options;
        const result = await super.delete({ name, version });
        return result;
    }
}

module.exports = Versions;
