const uuid = require('uuid');

const generateAlgorithm = options => ({
    name: options?.name || `alg-${uuid.v4()}`,
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

const generateBuild = (algorithm, progress) => ({
    buildId: uuid.v4(),
    imageTag: 'lfhge07l',
    algorithm,
    env: 'python',
    fileExt: 'zip',
    filePath: 'cicd-hkube-builds/test1-wds86s',
    algorithmName: algorithm.name,
    type: 'Code',
    status: 'active',
    progress: progress || 60,
    error: null,
    trace: null,
    endTime: null,
    startTime: 1606063275506,
    data: null,
    timestamp: 1606063281438,
});

const generatePipeline = () => ({
    name: `pipeline-${uuid.v4()}`,
    experimentName: `experimentName-${uuid.v4()}`,
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
    triggers: {
        pipelines: ['a', 'b', 'c'],
        cron: {
            pattern: '* * * * *',
            enable: true,
        },
    },
    types: ['stored', 'cron', 'stream'],
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

const generatePipelineDriver = () => ({
    name: `pipeline-driver-${uuid.v4()}`,
    image: 'hkube/pipeline-driver',
    cpu: 0.15,
    mem: 2048,
});

const generateAlgorithmReadme = algorithm => ({
    name: algorithm?.name || uuid.v4(),
    data: `
    algorithm    
    Options:    
    |option|description|type|required|default|  
    |---|---|---|---|---|  
    |name|The name of the algorithm|string|||  
    |--file, -f|the algorithm file|string|||  
    |--env|the algorithm env  [choices: "python", "nodejs", "java"]|string|||  
    |--codePath|the code path for the algorithm|string|||  
    |--codeEntryPoint, --entryPoint|the code entry point for the algorithm|string|||  
    |--image, --algorithmImage|set algorithm image|string|||  
    |--cpu|CPU requirements of the algorithm in cores |number|||  
    |--gpu|GPU requirements of the algorithm in cores |number|||  
    |--mem|memory requirements of the algorithm. Possible units are ['Ki', 'M', 'Mi', 'Gi']. Minimum is 4Mi|string|||  
    |--noWait|if true, does not wait for the build to finish  |boolean||false|  
    |--setCurrent|if true, sets the new version as the current version|boolean||false|  
    `,
});

const generatePipelineReadme = () => ({
    name: uuid.v4(),
    data: `
    pipeline    
    Options:    
    |option|description|type|required|default|  
    |---|---|---|---|---|  
    |name|The name of the algorithm|string|||  
    |--file, -f|the algorithm file|string|||  
    |--env|the algorithm env  [choices: "python", "nodejs", "java"]|string|||  
    |--codePath|the code path for the algorithm|string|||  
    |--codeEntryPoint, --entryPoint|the code entry point for the algorithm|string|||  
    |--image, --algorithmImage|set algorithm image|string|||  
    |--cpu|CPU requirements of the algorithm in cores |number|||  
    |--gpu|GPU requirements of the algorithm in cores |number|||  
    |--mem|memory requirements of the algorithm. Possible units are ['Ki', 'M', 'Mi', 'Gi']. Minimum is 4Mi|string|||  
    |--noWait|if true, does not wait for the build to finish  |boolean||false|  
    |--setCurrent|if true, sets the new version as the current version|boolean||false|  
    `,
});

const generateTensorboard = () => ({
    boardLink: 'hkube/board/a178/',
    boardReference: 'a178',
    endTime: null,
    error: null,
    id: uuid.v4(),
    jobId: 'main:exec_pipeline:6kvq38gc',
    logDir: '/var/tmp/fs/storage/local-hkube-algo-metrics/',
    nodeName: 'A',
    pipelineName: 'exec_pipeline',
    result: null,
    startTime: 1606647118209,
    status: 'pending',
    taskId: 'A:eval-alg:d5c7ce6c-b8d9-4631-b9cb-95d25b268f06',
    type: 'task',
});

const generateWebhook = () => ({
    jobId: uuid.v4(),
    type: 'progress',
    url: 'http://my-url-to-progress',
    pipelineStatus: 'pending',
    responseStatus: 'failed',
    httpResponse: {
        statusCode: 'ENOTFOUND',
        statusMessage: 'getaddrinfo ENOTFOUND my-url-to-progress',
    },
    status: 'completed',
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
    generatePipelineDriver,
    generateAlgorithmReadme,
    generatePipelineReadme,
    generateTensorboard,
    generateWebhook,
};