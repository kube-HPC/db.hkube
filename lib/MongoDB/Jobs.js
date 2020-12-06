const Collection = require('./Collection');
const collections = require('./collections');

class Jobs extends Collection {
    constructor(db, client) {
        super(db, client, collections.Jobs);
    }

    /**
     * @param {object} job
     * @returns {Promise<Job>}
     */
    async create(job) {
        return super.create(job);
    }

    async fetch({ jobId }) {
        return this._fetchJob({ jobId });
    }

    async fetchGraph({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { graph: true });
        return { jobId, ...entry.graph };
    }

    async fetchStatus({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { status: true });
        return { jobId, ...entry.status };
    }

    async fetchResult({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { result: true });
        return { jobId, ...entry.result };
    }

    async _fetchJob({ jobId }, fields) {
        const entry = await super.fetch(
            { jobId },
            {
                fields,
                excludeId: true,
            }
        );
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

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Jobs;
