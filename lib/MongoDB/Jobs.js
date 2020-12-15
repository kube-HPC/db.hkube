const moment = require('moment');
const Collection = require('./Collection');
const collections = require('./collections');
const Query = require('./Query');

class Jobs extends Collection {
    constructor(db, client) {
        super(db, client, collections.Jobs);
    }

    /**
     * @param {object} job
     * @returns {Promise<Job>}
     */
    async create(job) {
        return super.create(job, { checkKeys: false });
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
        hasResult = undefined,
        limit = 0,
    }) {
        const query = new Query()
            .addParam('pipeline.experimentName', experimentName)
            .addParam('pipeline.name', pipelineName)
            .addParam('pipeline.types', pipelineType)
            .addParam('pipeline.nodes.algorithmName', algorithmName)
            .addExists('result', hasResult)
            .create();

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
        const timestamp = Date.now();
        await super.patch({
            query: { jobId },
            onFetch: entry => {
                const timeTook = this._calcTimeTook(entry.pipeline.startTime);
                return { result: { ...data, timestamp, timeTook } };
            },
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
            onFetch: entry => {
                return { status: { ...entry.status, ...data, timestamp } };
            },
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

    async delete({ jobId }) {
        const result = await super.delete({ jobId });
        return result;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Jobs;
