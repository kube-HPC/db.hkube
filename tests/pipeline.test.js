const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');

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

describe('Pipelines', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const promise = db.pipelines.fetch(pipeline);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        await db.pipelines.create(pipeline);
        const promise = db.pipelines.create(pipeline);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch pipeline', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const res1 = await db.pipelines.create(pipeline);
        const res2 = await db.pipelines.fetch({ name: pipeline.name });
        expect(res1).to.eql(res2);
    });
    it('should create and update pipeline', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const name = pipeline.name;
        const params = { ttl: 60 };
        await db.pipelines.create(pipeline);
        await db.pipelines.update({ ...params, name });
        const res = await db.pipelines.fetch({ name });
        expect(res).to.eql({ ...pipeline, ...params });
    });
    it('should upsert and update', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const name = pipeline.name;
        const params = { cpu: 2, mem: '512Mi' };
        await db.pipelines.update(pipeline);
        await db.pipelines.update({ ...params, name });
        const res = await db.pipelines.fetch({ name });
        expect(res).to.eql({ ...pipeline, ...params });
    });
    it('should create and fetch pipeline list', async () => {
        const db = await connect();
        const pipeline1 = generatePipeline();
        const pipeline2 = generatePipeline();
        const pipeline3 = generatePipeline();
        await db.pipelines.create(pipeline1);
        await db.pipelines.create(pipeline2);
        await db.pipelines.create(pipeline3);
        const list = await db.pipelines.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
