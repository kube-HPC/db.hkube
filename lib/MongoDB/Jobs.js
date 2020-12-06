const moment = require('moment');
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

    async fetchPipeline({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { pipeline: true });
        return { jobId, ...entry.pipeline };
    }

    async fetchStatus({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { status: true });
        return { jobId, ...entry.status };
    }

    async fetchResult({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { result: true });
        return { jobId, ...entry.result };
    }

    async fetchRunning({ sort = null, limit = 0 }) {
        const entry = await super.fetchAll({
            query: { result: { $exists: false } },
            sort,
            limit,
            excludeId: true,
        });
        return entry;
    }

    async fetchRunningByAlgorithmName({ algorithmName, sort = null, limit = 0 }) {
        const entry = await super.fetchAll({
            query: { 'nodes.algorithmName': algorithmName, result: { $exists: false } },
            sort,
            limit,
            excludeId: true,
        });
        return entry;
    }

    async fetchRunningByJobIdPrefix({ jobId, sort = null, limit = 0 }) {
        const entry = await super.fetchAll({
            query: { jobId: { $regex: `^${jobId}.*` }, result: { $exists: false } },
            sort,
            limit,
            excludeId: true,
        });
        return entry;
    }

    async fetchRunningByPipelineName({ pipelineName, sort = null, limit = 0 }) {
        const entry = await super.fetchAll({
            query: { 'pipeline.name': pipelineName, result: { $exists: false } },
            sort,
            limit,
            excludeId: true,
        });
        return entry;
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

    async updateResult(job) {
        const { jobId, startTime, data } = job;
        const timestamp = new Date();
        const timeTook = this._calcTimeTook(startTime);
        await super.updateOne({
            filter: { jobId },
            query: { $set: { result: { ...data, timestamp, timeTook } } },
        });
        return job;
    }

    _calcTimeTook(start) {
        const now = moment(Date.now());
        const startTime = moment(start);
        return now.diff(startTime, 'seconds', true);
    }

    async updateStatus(job) {
        const { jobId, data } = job;
        await super.updateOne({
            filter: { jobId },
            query: { $set: { status: data } },
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

    async fetchCronByPipelineAndExperiment({
        experimentName,
        pipelineName,
        fields = {},
        sort = null,
        limit = 0,
    } = {}) {
        const list = await super.fetchAll({
            query: {
                'pipeline.experimentName': experimentName,
                'pipeline.name': pipelineName,
                'pipeline.types': 'cron',
            },
            fields,
            sort,
            limit,
            excludeId: true,
        });
        return list;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Jobs;
