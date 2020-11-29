const { expect } = require('chai');
const connect = require('./connect');
const { generatePipeline } = require('./common');

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
    it('should create and patch pipeline', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const name = pipeline.name;
        const params = { ttl: 60 };
        await db.pipelines.create(pipeline);
        await db.pipelines.patch({ ...params, name });
        const res = await db.pipelines.fetch({ name });
        expect(res).to.eql({ ...pipeline, ...params });
    });
    it('should create and delete pipeline', async () => {
        const db = await connect();
        const pipeline = generatePipeline();
        const name = pipeline.name;
        await db.pipelines.create(pipeline);
        await db.pipelines.delete({ name });
        const promise = db.pipelines.fetch({ name });
        await expect(promise).to.be.rejectedWith(/could not find/i);
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
