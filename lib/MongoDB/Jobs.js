const moment = require('moment');
const { pipelineStatuses } = require('@hkube/consts');
const Collection = require('./Collection');
const collections = require('./collections');
const Query = require('./Query');

const doneStatus = [
    pipelineStatuses.CRASHED,
    pipelineStatuses.FAILED,
    pipelineStatuses.STALLED,
    pipelineStatuses.STOPPED,
    pipelineStatuses.COMPLETED,
];

const queryFilters = {
    activeJobs: { 'status.status': { $not: { $in: doneStatus } } },
    inactiveJobs: { 'status.status': { $in: doneStatus } },
};

class Jobs extends Collection {
    constructor(db, client) {
        super(db, client, collections.Jobs);
    }

    async create(job) {
        return super.create(job);
    }

    async fetch({ jobId, fields }) {
        return this._fetchJob({ jobId }, fields);
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

    _removeLargeObjectsProjection(items = [], maxSize = null) {
        if (maxSize == null) {
            return undefined;
        }
        const projectionItems = {};
        items.forEach(item => {
            const propName = item;
            const propRef = `$${propName}`;
            projectionItems[propName] = {
                $cond: {
                    if: {
                        $gt: [
                            {
                                $bsonSize: propRef,
                            },
                            maxSize,
                        ],
                    },
                    then: {
                        truncated: {
                            $concat: [
                                'Size of object (',
                                {
                                    $toString: {
                                        $bsonSize: propRef,
                                    },
                                },
                                `) is larger than ${maxSize}`,
                            ],
                        },
                    },
                    else: propRef,
                },
            };
        });

        return projectionItems;
    }

    /**
     * Returns a list of most recent jobs, optionally truncating large objects
     * (specifically flowInput)
     *
     */
    async getPipelines({
        experimentName,
        itemsToRemove,
        maxItemsSize,
        limit = 100,
    }) {
        const query = new Query()
            .addParam('pipeline.experimentName', experimentName)
            .create();
        const aggregatePipeline = [
            { $match: query },
            { $sort: { 'pipeline.startTime': -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    key: '$jobId',
                    results: '$result',
                    pipeline: 1,
                    userPipeline: 1,
                    status: 1,
                    graph: 1,
                },
            },
        ];
        const remove = this._removeLargeObjectsProjection(
            itemsToRemove,
            maxItemsSize
        );
        if (remove) {
            aggregatePipeline.push({
                $addFields: remove,
            });
        }

        const pipelines = await this.collection
            .aggregate(aggregatePipeline)
            .toArray();
        return pipelines;
    }

    async getPipelinesStats({ pipelineType, experimentName, limit = 0 } = {}) {
        const query = new Query()
            .addParam('pipeline.types', pipelineType)
            .addParam('pipeline.experimentName', experimentName)
            .create();
        const sizeLimit = parseInt(limit, 10);
        const collection = await this.collection
            .aggregate([
                { $match: query },
                { $sort: { 'pipeline.startTime': -1 } },
                { $limit: sizeLimit },
                {
                    $group: {
                        _id: {
                            pipeline: '$status.pipeline',
                            status: '$status.status',
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: { pipeline: '$_id.pipeline' },
                        stats: {
                            $push: {
                                status: '$_id.status',
                                count: '$count',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        name: '$_id.pipeline',
                        stats: '$stats',
                    },
                },
            ])
            .toArray();
        return collection;
    }

    async fetchGraph({ jobId }) {
        const entry = await this._fetchJob({ jobId }, { graph: true });
        return entry && { jobId, ...entry.graph };
    }

    async search({
        experimentName,
        pipelineName,
        pipelineType,
        pipelineStatus,
        algorithmName,
        excludeId = true,
        hasResult,
        sort = null,
        limit = 0,
        fields = {},
        exists,
    }) {
        const query = this._createQuery({ experimentName, pipelineName, pipelineType, algorithmName, pipelineStatus, hasResult, exists });
        const entries = await super.fetchAll({
            query,
            sort,
            limit,
            fields,
            excludeId,
        });
        return entries;
    }

    _createQuery({
        experimentName,
        pipelineName,
        pipelineType,
        algorithmName,
        pipelineStatus,
        datesRange,
        hasResult,
        exists } = {}) {
        return new Query()
            .addParam('pipeline.experimentName', experimentName)
            .addParam('pipeline.name', pipelineName)
            .addParam('pipeline.types', pipelineType)
            .addParam('pipeline.nodes.algorithmName', algorithmName)
            .addParam('status.status', pipelineStatus)
            .addDatesRange('pipeline.startTime', datesRange)
            .addExists({ result: hasResult })
            .addExists(exists)
            .create();
    }

    async searchApi({
        query,
        cursor,
        pageNum,
        sort,
        limit,
        fields,
        exists,
    }) {
        const queryObj = this._createQuery({ ...query, exists });
        const response = await super.searchApi({
            query: queryObj,
            cursor,
            pageNum,
            sort,
            limit,
            fields,
            exists,
        });
        return response;
    }

    async _fetchJob({ jobId }, fields) {
        const entry = await super.fetch(
            { jobId },
            {
                fields,
                excludeId: true,
            }
        );
        if (entry && Object.keys(entry).length) {
            return entry;
        }
        return null;
    }

    async updateResult(job) {
        const { jobId, ...data } = job;
        const timestamp = Date.now();
        await super.patch({
            query: { jobId },
            handleUpdate: entry => {
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

    async updateStatus(job, updateOnlyActive) {
        const { jobId, ...data } = job;
        const timestamp = Date.now();
        const stopped = updateOnlyActive
            ? { 'status.status': { $not: { $in: [pipelineStatuses.STOPPED, pipelineStatuses.PAUSED] } } }
            : {};
        await super.patch({
            query: { jobId, ...stopped },
            handleUpdate: entry => {
                return { status: { ...entry.status, ...data, timestamp } };
            },
        });
        return job;
    }

    async updateGraph(job) {
        const { jobId, ...data } = job;
        await super.patch({
            query: { jobId },
            handleUpdate: () => {
                return { graph: data.graph };
            },
        });
        return job;
    }

    async updatePipeline(job) {
        const { jobId, ...data } = job;
        await super.patch({
            query: { jobId },
            handleUpdate: entry => {
                return { pipeline: { ...entry.pipeline, ...data } };
            },
        });
        return job;
    }

    async delete({ jobId }) {
        const result = await super.delete({ jobId });
        return result;
    }

    scanMountedDataSources({
        returnActiveJobs = true,
        inactiveTime = 0,
        inactiveTimeUnits = 'ms',
    }) {
        const minTimeStamp = inactiveTime
            ? moment().subtract(inactiveTime, inactiveTimeUnits)
            : null;
        return this.collection
            .aggregate([
                {
                    $match: {
                        ...(returnActiveJobs
                            ? queryFilters.activeJobs
                            : queryFilters.inactiveJobs),
                        'pipeline.nodes.kind': 'dataSource',
                        ...(!returnActiveJobs && inactiveTime
                            ? {
                                'result.timestamp': {
                                    $gte: minTimeStamp.valueOf(),
                                },
                            }
                            : {}),
                    },
                },
                {
                    $project: {
                        nodes: {
                            $filter: {
                                input: '$pipeline.nodes',
                                as: 'node',
                                cond: { $eq: ['$$node.kind', 'dataSource'] },
                            },
                        },
                    },
                },
            ])
            .toArray();
    }

    async watchStatus({ jobId }, cb) {
        const pipeline = {
            $match: {
                $or: [
                    { operationType: 'insert' },
                    { operationType: 'update' }]
            }
        };
        let key = '*-status';
        if (jobId) {
            key = `${jobId}-status`;
            pipeline.$match['fullDocument.jobId'] = jobId;
        }
        const watcher = this._watchMap.get(key);
        if (watcher) {
            return;
        }
        const watchCursor = await super.watch([pipeline], (doc) => {
            let updatedFields;
            const { status } = doc.fullDocument || {};

            if (doc.operationType === 'update') {
                updatedFields = doc.updateDescription?.updatedFields?.status;
            }
            if (status) {
                const { _id, ...rest } = status;
                const job = { ...rest, ...updatedFields, jobId: doc.fullDocument.jobId };
                cb(job);
            }
        });
        this._watchMap.set(key, watchCursor);
    }

    async watchResult({ jobId }, cb) {
        const pipeline = {
            $match: {
                $or: [
                    {
                        operationType: 'insert',
                    },
                    {
                        operationType: 'update',
                    }],
            }
        };
        let key = '*-result';
        if (jobId) {
            key = `${jobId}-result`;
            pipeline.$match['fullDocument.jobId'] = jobId;
        }
        const watcher = this._watchMap.get(key);
        if (watcher) {
            return;
        }
        const watchCursor = await super.watch([pipeline], (doc) => {
            let updatedFields;
            const { result } = doc.fullDocument || {};
            if (doc.operationType === 'update') {
                updatedFields = doc.updateDescription?.updatedFields?.result;
            }
            if (result) {
                const { _id, ...rest } = result;
                const job = { ...rest, ...updatedFields, jobId: doc.fullDocument.jobId };
                cb(job);
            }
        });
        this._watchMap.set(key, watchCursor);
    }

    async unwatchStatus({ jobId }) {
        let key = '*-status';
        if (jobId) {
            key = `${jobId}-status`;
        }
        const watchCursor = this._watchMap.get(key);
        if (watchCursor) {
            await watchCursor.close();
        }
    }

    async unwatchResult({ jobId }) {
        let key = '*-result';
        if (jobId) {
            key = `${jobId}-result`;
        }
        const watchCursor = this._watchMap.get(key);
        if (watchCursor) {
            await watchCursor.close();
        }
    }
}

module.exports = Jobs;
module.exports.doneStatus = doneStatus;
module.exports.queryFilters = queryFilters;
