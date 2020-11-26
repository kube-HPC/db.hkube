const Collection = require('./Collection');
const collections = require('../const/collections');

class Jobs extends Collection {
    constructor(db, client) {
        super(db, client, collections.Jobs);
    }

    /**
     * @param {object} job
     * @param {string} job.jobId
     * @param {pipeline} job.pipeline
     * @param {graph} job.graph
     * @param {status} job.status
     * @param {result} job.result
     * @returns {Promise<DataSource>}
     */
    async create(job) {
        return super.create(job);
    }

    async fetch({ jobId }) {
        const entry = await super.fetch({ jobId }, { excludeId: true });
        return entry;
    }

    async update(job) {
        const { jobId } = job;
        await super.updateOne({
            filter: { jobId },
            query: { $set: job },
        });
        return job;
    }

    async patch(job) {
        const entry = await super.patch({
            query: { jobId: job.jobId },
            data: job,
        });
        return entry;
    }

    async delete(job) {
        const result = await super.delete(job);
        return result;
    }

    async fetchAll({ query, fields, sort, limit } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Jobs;
