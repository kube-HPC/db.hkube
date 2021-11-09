const config = {
    Algorithms: {
        Store: {
            name: 'algorithms.store',
            entityName: 'algorithm',
            indices: [
                {
                    indexName: 'algorithmName',
                    name: 'asc',
                    unique: true,
                },
            ],
        },
        Builds: {
            name: 'algorithms.builds',
            entityName: 'build',
            indices: [
                {
                    indexName: 'buildId',
                    buildId: 'asc',
                    unique: true,
                },
            ],
        },
        Versions: {
            name: 'algorithms.versions',
            entityName: 'version',
            indices: [
                {
                    indexName: 'versionId',
                    version: 'asc',
                    unique: true,
                },
            ],
        },
        Readme: {
            name: 'algorithms.readme',
            entityName: 'algorithm readme',
            indices: [
                {
                    indexName: 'algorithmName',
                    name: 'asc',
                    unique: true,
                },
            ],
        },
    },
    DataSources: {
        name: 'dataSources.store',
        entityName: 'dataSource',
        indices: [
            {
                indexName: 'dataSourceName',
                name: 'asc',
                unique: false,
            },
        ],
    },
    Snapshots: {
        name: 'dataSources.snapshots',
        entityName: 'snapshot',
        indices: [
            {
                indexName: 'snapshotsNameAndVersion',
                name: 'asc',
                'dataSource.name': 'asc',
                unique: true,
            },
        ],
    },
    Experiments: {
        name: 'experiments',
        entityName: 'experiment',
        indices: [
            {
                indexName: 'experimentName',
                name: 'asc',
                unique: true,
            },
        ],
    },
    Gateways: {
        name: 'gateways',
        entityName: 'gateway',
        indices: [
            {
                indexName: 'gatewayName',
                name: 'asc',
                unique: true,
            },
        ],
    },
    PipelineDrivers: {
        name: 'pipelineDrivers',
        entityName: 'pipelineDriver',
        indices: [
            {
                indexName: 'pipelineDriverName',
                name: 'asc',
                unique: true,
            },
        ],
    },
    Jobs: {
        name: 'jobs',
        entityName: 'job',
        indices: [
            {
                indexName: 'jobId',
                jobId: 'asc',
                unique: true,
            },
            {
                indexName: 'pipeline.startTime',
                'pipeline.startTime': 'asc',
                unique: false,
            },
        ],
    },
    Pipelines: {
        Store: {
            name: 'pipelines.store',
            entityName: 'pipeline',
            indices: [
                {
                    indexName: 'pipelineName',
                    name: 'asc',
                    unique: true,
                },
            ],
        },
        Readme: {
            name: 'pipelines.readme',
            entityName: 'pipeline readme',
            indices: [
                {
                    indexName: 'pipelineName',
                    name: 'asc',
                    unique: true,
                },
            ],
        },
    },
    TensorBoards: {
        name: 'tensorboards',
        entityName: 'tensorboard',
        indices: [
            {
                indexName: 'boardId',
                id: 'asc',
                unique: true,
            },
        ],
    },
    OptunaBoards: {
        name: 'optunaboards',
        entityName: 'optunaboard',
        indices: [
            {
                indexName: 'boardId',
                id: 'asc',
                unique: true,
            },
        ],
    },
    TriggersTree: {
        name: 'triggersTree',
        entityName: 'triggerTree',
        indices: [
            {
                indexName: 'jobId',
                jobId: 'asc',
                unique: true,
            },
        ],
    },
    Webhooks: {
        Status: {
            name: 'webhooks.status',
            entityName: 'webhook',
            indices: [
                {
                    indexName: 'jobId',
                    jobId: 'asc',
                    unique: true,
                },
            ],
        },
        Result: {
            name: 'webhooks.result',
            entityName: 'webhook',
            indices: [
                {
                    indexName: 'jobId',
                    jobId: 'asc',
                    unique: true,
                },
            ],
        },
    },
};

module.exports = config;
