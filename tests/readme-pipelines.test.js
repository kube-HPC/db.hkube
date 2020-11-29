const { expect } = require('chai');
const connect = require('./connect');
const { generatePipelineReadme } = require('./common');

describe('ReadMePipelines', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const readme = generatePipelineReadme();
        const promise = db.readme.pipelines.fetch(readme);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const readme = generatePipelineReadme();
        await db.readme.pipelines.create(readme);
        const promise = db.readme.pipelines.create(readme);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch readme', async () => {
        const db = await connect();
        const readme = generatePipelineReadme();
        const res1 = await db.readme.pipelines.create(readme);
        const res2 = await db.readme.pipelines.fetch({ name: readme.name });
        expect(res1).to.eql(res2);
    });
    it('should create and update readme', async () => {
        const db = await connect();
        const readme = generatePipelineReadme();
        const name = readme.name;
        const params = { data: 'the readme file|string' };
        await db.readme.pipelines.create(readme);
        await db.readme.pipelines.update({ ...params, name });
        const res = await db.readme.pipelines.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and patch readme', async () => {
        const db = await connect();
        const readme = generatePipelineReadme();
        const name = readme.name;
        const params = { isMain: true };
        await db.readme.pipelines.create(readme);
        await db.readme.pipelines.patch({ ...params, name });
        const res = await db.readme.pipelines.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and fetch readme list', async () => {
        const db = await connect();
        const readme1 = generatePipelineReadme();
        const readme2 = generatePipelineReadme();
        const readme3 = generatePipelineReadme();
        await db.readme.pipelines.create(readme1);
        await db.readme.pipelines.create(readme2);
        await db.readme.pipelines.create(readme3);
        const list = await db.readme.pipelines.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
