module.exports = {
    Algorithms: {
        name: 'algorithm',
        index: {
            name: 'name',
            unique: true,
        },
    },
    Builds: {
        name: 'build',
    },
    Versions: {
        name: 'version',
    },
    DataSources: {
        name: 'dataSource',
        index: {
            name: 'name',
            unique: false,
        },
    },
    Experiments: {
        name: 'experiment',
        index: {
            name: 'name',
            unique: true,
        },
    },
    Jobs: {
        name: 'job',
        index: {
            name: 'jobId',
            unique: true,
        },
    },
    Pipelines: {
        name: 'pipeline',
        index: {
            name: 'name',
            unique: true,
        },
    },
};
