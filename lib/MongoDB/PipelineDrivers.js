const Collection = require('./Collection');
const collections = require('./collections');

class PipelineDrivers extends Collection {
    constructor(db, client) {
        super(db, client, collections.PipelineDrivers);
    }

    async create(pipelineDriver) {
        return super.create(pipelineDriver);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async update(pipelineDriver) {
        await super.updateOne({
            filter: { name: pipelineDriver.name },
            query: { $set: pipelineDriver },
            upsert: true,
        });
        return pipelineDriver;
    }

    async delete({ name }) {
        const result = await super.delete({ name });
        return result;
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
}

module.exports = PipelineDrivers;
