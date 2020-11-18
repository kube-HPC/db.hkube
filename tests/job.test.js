const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');

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

const generatePipeline = () => ({
    name: 'simple-flow',
    nodes: [
        {
            nodeName: 'green',
            algorithmName: 'green-alg',
            input: ['@flowInput.files.link'],
        },
        {
            nodeName: 'yellow',
            algorithmName: 'yellow-alg',
            input: ['@green'],
        },
        {
            nodeName: 'black',
            algorithmName: 'black-alg',
            input: ['@yellow'],
        },
        {
            nodeName: 'white',
            algorithmName: 'black-alg',
            input: ['test'],
        },
    ],
    options: {
        batchTolerance: 30,
        progressVerbosityLevel: 'debug',
    },
});

const generateStatus = () => ({
    timestamp: '2020-11-18T10:38:37.849Z',
    jobId: 'main:DAG:7pn9ewgg',
    status: 'active',
    level: 'debug',
    pipeline: 'DAG',
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
    timestamp: '2020-11-18T11:14:40.884Z',
    jobId: 'main:DAG:7pn9ewgg',
    pipeline: 'DAG',
    data: {
        storageInfo: {
            path: 'local-hkube-results/main:DAG:7pn9ewgg/result.json',
        },
    },
    status: 'completed',
    timeTook: 2163.044,
});

const createJob = () => ({
    jobId: `jobId-${uuid.v4()}`,
    pipeline: generatePipeline(),
    graph: generateGraph(),
    status: generateStatus(),
    result: generateResult(),
});

describe('Jobs', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const job = createJob();
        const promise = db.jobs.fetch(job);
        await expect(promise).to.be.rejectedWith(
            `could not find jobs:${job.jobId}`
        );
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const job = createJob();
        await db.jobs.create(job);
        const promise = db.jobs.create(job);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch job', async () => {
        const db = await connect();
        const job = createJob();
        const res1 = await db.jobs.create(job);
        const res2 = await db.jobs.fetch({ jobId: job.jobId });
        expect(res1).to.eql(res2);
    });
    it('should create and update job', async () => {
        const db = await connect();
        const job = createJob();
        const graph = generateGraph();
        await db.jobs.create(job);
        await db.jobs.update({ ...job, graph });
        const res = await db.jobs.fetch({ jobId: job.jobId });
        expect(res).to.eql({ ...job, graph });
    });
    it('should upsert and update job', async () => {
        const db = await connect();
        const job = createJob();
        const graph = generateGraph();
        await db.jobs.update(job);
        await db.jobs.update({ ...job, graph });
        const res = await db.jobs.fetch({ jobId: job.jobId });
        expect(res).to.eql({ ...job, graph });
    });
    it('should create and fetch job list', async () => {
        const db = await connect();
        const job1 = createJob();
        const job2 = createJob();
        const job3 = createJob();
        await db.jobs.create(job1);
        await db.jobs.create(job2);
        await db.jobs.create(job3);
        const list = await db.jobs.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
