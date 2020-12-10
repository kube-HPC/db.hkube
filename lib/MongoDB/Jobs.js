const moment = require('moment');
const Collection = require('./Collection');
const collections = require('./collections');
const { queryMapper } = require('./utils');

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
        return entry && { jobId, ...entry.graph };
    }

    async fetchPipeline({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { pipeline: true });
        return entry && { jobId, ...entry.pipeline };
    }

    async fetchStatus({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { status: true });
        return entry && { jobId, ...entry.status };
    }

    async fetchResult({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { result: true });
        return entry && { jobId, ...entry.result };
    }

    async search({
        experimentName,
        pipelineName,
        pipelineType,
        algorithmName,
        fields = {},
        sort = null,
        isRunning = undefined,
        hasResult = undefined,
        limit = 0,
    }) {
        const query = {
            ...queryMapper('pipeline.experimentName', experimentName),
            ...queryMapper('pipeline.name', pipelineName),
            ...queryMapper('pipeline.types', pipelineType),
            ...queryMapper('pipeline.nodes.algorithmName', algorithmName),
            ...(isRunning !== undefined && { result: { $exists: !isRunning } }),
            ...(hasResult !== undefined && { result: { $exists: hasResult } }),
        };
        const entries = await super.fetchAll({
            query,
            sort,
            limit,
            fields,
            excludeId: true,
        });
        return entries;
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
        const { jobId, ...data } = job;
        const pipeline = await this.fetchPipeline({ jobId });
        const timestamp = Date.now();
        const timeTook = this._calcTimeTook(pipeline?.startTime);
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
        const { jobId, ...data } = job;
        const timestamp = Date.now();
        await super.patch({
            query: { jobId },
            data: { status: { ...data, timestamp } },
        });
        return job;
    }

    async updatePipeline(pipeline) {
        const { jobId } = pipeline;
        await super.patch({
            query: { jobId },
            data: { jobId, pipeline },
        });
        return pipeline;
    }

    async patchPipeline(pipeline, onFetch) {
        const entry = await super.patch({
            query: { 'pipeline.name': pipeline.name },
            data: { pipeline },
            onFetch,
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
