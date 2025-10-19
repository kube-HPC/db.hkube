const uuid = require('uuid').v4;
const { dummyFile } = require('./mocks');
const { devenvTypes, executeActions } = require('@hkube/consts');
const generateAlgorithm = options => ({
    name: options?.name || `alg-${uuid()}`,
    algorithmImage: `hkube/algorithm-${uuid()}`,
    cpu: options?.cpu || 1,
    mem: '256Mi',
    env: options?.env || 'python',
    kind: 'algorithm',
    options: {
        debug: false,
        pending: false,
    },
    minHotWorkers: 0,
    'key.with.dot': {
        'and.nested': 'bla',
    },
    envVars: {
        'and.nested': 'bla',
    },
    type: 'Image',
});

const generateTask = ({ jobId, taskId, nodeName, status, batchIndex } = {}) => ({
    jobId: jobId || uuid(),
    taskId: taskId || uuid(),
    input: [],
    output: {
        path: uuid(),
    },
    nodeName: nodeName || `node-${uuid()}`,
    podName: `pod-${uuid()}`,
    status: status || 'created',
    batchIndex: batchIndex || 1,
    startTime: Date.now(),
    endTime: Date.now(),
});

const generateVersion = (algorithm, semver) => {
    const version = uuid();
    return {
        version,
        name: algorithm.name,
        semver: semver || '1.0.0',
        created: Date.now(),
        algorithm: { ...algorithm, version },
    };
};

const generateBuild = (algorithm, progress) => ({
    buildId: uuid(),
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
    'key.with.dot': {
        'and.nested': 'bla',
    },
    envVars: {
        'and.nested': 'bla',
    },
});

const generatePipeline = ({ startTime, experimentName, pipelineType, tags } = {}) => ({
    name: `pipeline-${uuid()}`,
    experimentName: experimentName || `experimentName-${uuid()}`,
    nodes: [
        {
            nodeName: 'green',
            algorithmName: `alg-${uuid()}`,
            input: ['@flowInput.files.link'],
        },
        {
            nodeName: 'yellow',
            algorithmName: `alg-${uuid()}`,
            input: ['@green'],
        },
        {
            nodeName: 'black',
            algorithmName: `alg-${uuid()}`,
            input: ['@yellow'],
        },
        {
            nodeName: 'white',
            algorithmName: `alg-${uuid()}`,
            input: ['test'],
        },
    ],
    ttl: 30,
    options: {
        batchTolerance: 30,
        progressVerbosityLevel: 'debug',
        concurrentPipelines: {
            amount: 5,
            rejectOnFailure: false
        }
    },
    triggers: {
        pipelines: ['a', 'b', 'c'],
        cron: {
            pattern: '* * * * *',
            enable: true,
        },
    },
    'key.with.dot': {
        'and.nested': 'bla',
    },
    envVars: {
        'and.nested': 'bla',
    },
    startTime: startTime || Date.now(),
    types: pipelineType || ['stored', 'cron', 'stream'],
    tags: tags || []
});

const generateGraph = () => ({
    timestamp: Date.now(),
    nodes: [
        {
            nodeName: `node-${uuid()}`,
            algorithmName: 'green-alg',
            input: [1, 2, true, '@data', '#@data', { obj: 'prop' }],
        },
        {
            nodeName: `node-${uuid()}`,
            algorithmName: 'green-alg',
            input: [1, 2, true, '@green', '#@data', { obj: 'prop' }],
        },
        {
            nodeName: `node-${uuid()}`,
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

const generateStatus = (useUnixTime = false, pipeline, status) => ({
    timestamp: useUnixTime ? Date.now() : new Date().toUTCString(),
    status: status || 'active',
    level: 'debug',
    pipeline: pipeline || `DAG-${uuid()}`,
    data: {
        progress: 0,
        states: {
            creating: 5,
            preschedule: 2,
        },
        details: '0% completed, 5 creating, 2 preschedule',
    }
});


const generateResult = (useUnixTime = false) => ({
    timestamp: useUnixTime ? Date.now() : new Date().toUTCString(),
    pipeline: `DAG-${uuid()}`,
    data: {
        storageInfo: {
            path: 'local-hkube-results/main:DAG:7pn9ewgg/result.json',
        },
    },
    status: 'completed',
    timeTook: 2163.044,
});

const generateJob = ({ useUnixTime, pipeline, status, experimentName, startTime, pipelineType, number = 1, tags} = {}) => ({
    jobId: `jobId-${uuid()}`,
    number,
    pipeline: generatePipeline({ startTime, experimentName, pipelineType, tags }),
    graph: generateGraph(),
    status: generateStatus(useUnixTime, pipeline, status),
    result: generateResult(useUnixTime),
    auditTrail: [generateAudit(executeActions.RUN)]
});

const generateAudit = ( action = executeActions.RESUME) => ({
    timestamp: Date.now(),
    user: 'defaultUser',
    action
})

const generateExperiment = () => ({
    name: uuid(),
    description: 'this is new description for new experiment',
});

const generateGateway = () => ({
    name: uuid(),
    nodeName: uuid(),
    jobId: uuid(),
    description: 'this is new description for new gateway',
});

const generatePipelineDriver = () => ({
    name: `pipeline-driver-${uuid()}`,
    image: 'hkube/pipeline-driver',
    cpu: 0.15,
    mem: 2048,
});

const generateAlgorithmReadme = algorithm => ({
    name: algorithm?.name || uuid(),
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
    name: uuid(),
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
    id: uuid(),
    jobId: 'main:exec_pipeline:6kvq38gc',
    logDir: '/var/tmp/fs/storage/local-hkube-algo-metrics/',
    nodeName: 'A',
    pipelineName: 'exec_pipeline',
    result: null,
    startTime: 1606647118209,
    status: 'pending',
    taskId: 'A:eval-alg:d5c7ce6c-b8d9-4631-b9cb-95d25b268f06',
    type: 'task',
    'key.with.dot': {
        'and.nested': 'bla',
    },
    envVars: {
        'and.nested': 'bla',
    },
});


const generateDevenv = () => ({
    name: uuid(),
    type: devenvTypes.JUPYTER
});


const generateWebhook = () => ({
    jobId: uuid(),
    type: 'progress',
    url: 'http://my-url-to-progress',
    pipelineStatus: 'pending',
    responseStatus: 'failed',
    httpResponse: {
        statusCode: 'ENOTFOUND',
        statusMessage: 'getaddrinfo ENOTFOUND my-url-to-progress',
    },
    status: 'completed',
    'key.with.dot': {
        'and.nested': 'bla',
    },
    envVars: {
        'and.nested': 'bla',
    },
});

const generateDataSourceNode = ({ id = uuid(), asSnapshot = false } = {}) => ({
    nodeName: uuid(),
    kind: 'dataSource',
    dataSource: asSnapshot
        ? {
            snapshot: {
                name: uuid(),
            },
            name: uuid(),
        }
        : { id },
});

const generateDataSourceJob = () => {
    let job = generateJob({ useUnixTime: true });
    return {
        ...job,
        pipeline: {
            ...job.pipeline,
            nodes: [
                generateDataSourceNode({ asSnapshot: Math.random() > 0.5 }),
                ...job.pipeline.nodes,
            ],
        },
    };
};

const generateEntries = amount => {
    const names = new Array(amount).fill(0).map(() => uuid());
    return {
        names,
        entries: names.map(name => ({
            name,
            files: [dummyFile],
            git: null,
            storage: null,
        })),
    };
};

const generateMockFiles = (amount = 4) =>
    new Array(amount).fill(0).map((file, ii) => ({
        id: `file-${ii}`,
        name: `file-${ii}-${uuid()}`,
        path: `path-${ii}`,
        size: 1,
        type: Math.random() > 0.5 ? 'csv' : 'md',
        uploadedAt: new Date().getTime(),
    }));

module.exports = {
    generateAlgorithm,
    generateTask,
    generateVersion,
    generateBuild,
    generatePipeline,
    generateGraph,
    generateStatus,
    generateResult,
    generateJob,
    generateExperiment,
    generateGateway,
    generatePipelineDriver,
    generateAlgorithmReadme,
    generatePipelineReadme,
    generateTensorboard,
    generateWebhook,
    generateDataSourceNode,
    generateDataSourceJob,
    generateEntries,
    generateMockFiles,
    generateDevenv,
    generateAudit
};
