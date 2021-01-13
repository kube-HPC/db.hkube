const { expect } = require('chai');
const connect = require('./connect');
const { generatePipeline } = require('./common');

describe('Pipelines', () => {
    it('should not throw error itemNotFound', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const response = await db.pipelines.fetch(pipeline);
        expect(response).to.be.null;
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
    it('should create and search has pipelines triggers', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        await db.pipelines.create(pipeline);
        const list = await db.pipelines.search({ hasPipelinesTriggers: true });
        expect(list.length).to.be.greaterThan(0);
    });
    it('should create and search pipeline triggers', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        await db.pipelines.create(pipeline);
        const list = await db.pipelines.search({ triggersPipeline: 'b' });
        expect(list.length).to.be.greaterThan(0);
    });
    it('should create and search cron triggers', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        await db.pipelines.create(pipeline);
        const list = await db.pipelines.search({
            hasCronTriggers: true,
            fields: { name: true, cron: 'triggers.cron.pattern' },
        });
        expect(list.every(l => l.cron !== null)).to.eql(true);
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
    it('should create and replace pipeline', async () => {
        const db = await connect();
        const pipeline1 = generatePipeline();
        const pipeline2 = generatePipeline();
        const name = pipeline1.name;
        await db.pipelines.create(pipeline1);
        await db.pipelines.replace({ ...pipeline2, name });
        const res = await db.pipelines.fetch({ name });
        expect(res).to.eql({ ...pipeline2, name });
    });
    it('should create and patch pipeline', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const name = pipeline.name;
        const params = { ttl: 60 };
        await db.pipelines.create(pipeline);
        await db.pipelines.patch({ ...params, name });
        const res = await db.pipelines.fetch({ name });
        const { key, ...data } = res;
        expect(data).to.eql({ ...pipeline, ...params });
    });
    it('should create and delete pipeline', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const name = pipeline.name;
        await db.pipelines.create(pipeline);
        await db.pipelines.delete({ name });
        const response = await db.pipelines.fetch({ name });
        expect(response).to.be.null;
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
