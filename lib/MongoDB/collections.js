/**
 * @typedef {{
 *     name: string;
 *     entityName: string;
 *     indices: [
 *         {
 *             name: string;
 *             unique: boolean;
 *         }
 *     ];
 * }} Config
 */

module.exports = {
    Algorithms: {
        Store: {
            name: 'algorithms',
            entityName: 'algorithm',
            indices: [
                {
                    name: 'algorithmName',
                    fields: {
                        name: 'asc',
                        unique: true,
                    },
                },
            ],
        },
        Builds: {
            name: 'algorithms.builds',
            entityName: 'build',
            indices: [
                {
                    name: 'buildId',
                    fields: {
                        buildId: 'asc',
                        unique: true,
                    },
                },
            ],
        },
        Versions: {
            name: 'algorithms.versions',
            entityName: 'version',
            indices: [
                {
                    name: 'versionId',
                    fields: {
                        version: 'asc',
                        unique: true,
                    },
                },
            ],
        },
    },
    DataSources: {
        name: 'dataSources',
        entityName: 'data source',
        indices: [
            {
                name: 'dataSourceName',
                fields: {
                    name: 'asc',
                    unique: false,
                },
            },
        ],
    },
    Experiments: {
        name: 'experiments',
        entityName: 'experiment',
        indices: [
            {
                name: 'experimentName',
                fields: {
                    name: 'asc',
                    unique: true,
                },
            },
        ],
    },
    Jobs: {
        name: 'jobs',
        entityName: 'job',
        indices: [
            {
                name: 'jobId',
                fields: {
                    jobId: 'asc',
                    unique: true,
                },
            },
        ],
    },
    Pipelines: {
        name: 'pipelines',
        entityName: 'pipeline',
        indices: [
            {
                name: 'pipelineName',
                fields: {
                    name: 'asc',
                    unique: true,
                },
            },
        ],
    },
    Readme: {
        Algorithms: {
            name: 'readme.algorithms',
            entityName: 'algorithm readme',
            indices: [
                {
                    name: 'algorithmName',
                    fields: {
                        name: 'asc',
                        unique: true,
                    },
                },
            ],
        },
        Pipelines: {
            name: 'readme.pipelines',
            entityName: 'pipeline readme',
            indices: [
                {
                    name: 'pipelineName',
                    fields: {
                        name: 'asc',
                        unique: true,
                    },
                },
            ],
        },
    },
    TensorBoards: {
        name: 'tensorboards',
        entityName: 'tensorboard',
        indices: [
            {
                name: 'boardId',
                fields: {
                    id: 'asc',
                    unique: true,
                },
            },
        ],
    },
    Webhooks: {
        Status: {
            name: 'webhooks.status',
            entityName: 'webhook',
            indices: [
                {
                    name: 'jobId',
                    fields: {
                        jobId: 'asc',
                        unique: true,
                    },
                },
            ],
        },
        Result: {
            name: 'webhooks.result',
            entityName: 'webhook',
            indices: [
                {
                    name: 'jobId',
                    fields: {
                        jobId: 'asc',
                        unique: true,
                    },
                },
            ],
        },
    },
};
