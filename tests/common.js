const uuid = require('uuid');

const generateAlgorithm = options => ({
    name: `alg-${uuid.v4()}`,
    algorithmImage: `hkube/algorithm-${uuid.v4()}`,
    cpu: options?.cpu || 1,
    mem: '256Mi',
    env: options?.env || 'python',
    options: {
        debug: false,
        pending: false,
    },
    minHotWorkers: 0,
    type: 'Image',
});

const generateVersion = (algorithm, semver) => {
    const version = uuid.v4();
    return {
        version,
        name: algorithm.name,
        semver: semver || '1.0.0',
        created: Date.now(),
        algorithm: { ...algorithm, version },
    };
};

const generateBuild = algorithm => ({
    buildId: uuid.v4(),
    imageTag: 'lfhge07l',
    algorithm,
    env: 'python',
    fileExt: 'zip',
    filePath: 'cicd-hkube-builds/test1-wds86s',
    algorithmName: algorithm.name,
    type: 'Code',
    status: 'active',
    progress: 60,
    error: null,
    trace: null,
    endTime: null,
    startTime: 1606063275506,
    data: null,
    timestamp: 1606063281438,
});

const generatePipeline = () => ({
    name: `pipeline-${uuid.v4()}`,
    nodes: [
        {
            nodeName: 'green',
            algorithmName: `alg-${uuid.v4()}`,
            input: ['@flowInput.files.link'],
        },
        {
            nodeName: 'yellow',
            algorithmName: `alg-${uuid.v4()}`,
            input: ['@green'],
        },
        {
            nodeName: 'black',
            algorithmName: `alg-${uuid.v4()}`,
            input: ['@yellow'],
        },
        {
            nodeName: 'white',
            algorithmName: `alg-${uuid.v4()}`,
            input: ['test'],
        },
    ],
    ttl: 30,
    options: {
        batchTolerance: 30,
        progressVerbosityLevel: 'debug',
    },
});

const generateGraph = () => ({
    timestamp: Date.now(),
    nodes: [
        {
            nodeName: `node-${uuid.v4()}`,
            algorithmName: 'green-alg',
            input: [1, 2, true, '@data', '#@data', { obj: 'prop' }],
        },
        {
            nodeName: `node-${uuid.v4()}`,
            algorithmName: 'green-alg',
            input: [1, 2, true, '@green', '#@data', { obj: 'prop' }],
        },
        {
            nodeName: `node-${uuid.v4()}`,
            algorithmName: 'green-alg',
            input: [1, 2, true, '@yellow', '#@data', { obj: 'prop' }],
        },
    ],
    edges: [
        {
            from: 'green',
            to: 'yellow',
            value: {
                types: ['waitNode', 'input'],
            },
        },
        {
            from: 'yellow',
            to: 'black',
            value: {
                types: ['waitNode', 'input'],
            },
        },
    ],
});

const generateStatus = () => ({
    timestamp: new Date().toUTCString(),
    status: 'active',
    level: 'debug',
    pipeline: `DAG-${uuid.v4()}`,
    data: {
        progress: 0,
        states: {
            creating: 5,
            preschedule: 2,
        },
        details: '0% completed, 5 creating, 2 preschedule',
    },
});

const generateResult = () => ({
    timestamp: new Date().toUTCString(),
    pipeline: `DAG-${uuid.v4()}`,
    data: {
        storageInfo: {
            path: 'local-hkube-results/main:DAG:7pn9ewgg/result.json',
        },
    },
    status: 'completed',
    timeTook: 2163.044,
});

const generateJob = () => ({
    jobId: `jobId-${uuid.v4()}`,
    pipeline: generatePipeline(),
    graph: generateGraph(),
    status: generateStatus(),
    result: generateResult(),
});

const generateExperiment = () => ({
    name: uuid.v4(),
    description: 'this is new description for new experiment',
});

module.exports = {
    generateAlgorithm,
    generateVersion,
    generateBuild,
    generatePipeline,
    generateGraph,
    generateStatus,
    generateResult,
    generateJob,
    generateExperiment,
};
