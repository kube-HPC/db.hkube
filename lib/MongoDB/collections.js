/**
 * @typedef {{
 *     name: string;
 *     entityName: string;
 *     index: {
 *         name: string;
 *         unique: boolean;
 *     };
 * }} Config
 */

module.exports = {
    Algorithms: {
        Store: {
            name: 'algorithms',
            entityName: 'algorithm',
            index: {
                name: 'name',
                unique: true,
            },
        },
        Builds: {
            name: 'algorithms.builds',
            entityName: 'build',
            index: {
                name: 'buildId',
                unique: true,
            },
        },
        Versions: {
            name: 'algorithms.versions',
            entityName: 'version',
            index: {
                name: 'version',
                unique: true,
            },
        },
    },
    DataSources: {
        name: 'dataSources',
        entityName: 'data source',
        index: {
            name: 'name',
            unique: false,
        },
    },
    Experiments: {
        name: 'experiments',
        entityName: 'experiment',
        index: {
            name: 'name',
            unique: true,
        },
    },
    Jobs: {
        name: 'jobs',
        entityName: 'job',
        index: {
            name: 'jobId',
            unique: true,
        },
    },
    Pipelines: {
        name: 'pipelines',
        entityName: 'pipeline',
        index: {
            name: 'name',
            unique: true,
        },
    },
    Readme: {
        Algorithms: {
            name: 'readme.algorithms',
            entityName: 'algorithm readme',
            index: {
                name: 'name',
                unique: true,
            },
        },
        Pipelines: {
            name: 'readme.pipelines',
            entityName: 'pipeline readme',
            index: {
                name: 'name',
                unique: true,
            },
        },
    },
    TensorBoards: {
        name: 'tensorboards',
        entityName: 'tensorboard',
        index: {
            name: 'id',
            unique: true,
        },
    },
    Webhooks: {
        Status: {
            name: 'webhooks.status',
            entityName: 'webhook',
            index: {
                name: 'jobId',
                unique: true,
            },
        },
        Result: {
            name: 'webhooks.result',
            entityName: 'webhook',
            index: {
                name: 'jobId',
                unique: true,
            },
        },
    },
};
