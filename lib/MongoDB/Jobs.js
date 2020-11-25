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
        const { jobId, graph, pipeline, status, result } = job;
        await super.updateOne({ filter: { jobId } }, { $set: { graph, pipeline, status, result } });
        return jobId;
    }

    async delete(job) {
        const result = await super.delete(job);
        return result;
    }

    async fetchAll({ query, excluded, included, sort, limit } = {}) {
        return super.fetchAll({
            query,
            excludeId: true,
            excluded,
            included,
            sort,
            limit,
        });
    }
}

module.exports = Jobs;
