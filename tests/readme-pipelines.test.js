const { expect } = require('chai');
const connect = require('./connect');
const { generatePipelineReadme } = require('./common');

/** @type {import('../lib/Provider').ProviderInterface} */
let db = null;

describe('ReadMePipelines', () => {
    before(async () => {
        db = await connect();
    });
    it('should not throw error itemNotFound', async () => {
        const readme = generatePipelineReadme();
        const response = await db.pipelines.readme.fetch(readme);
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const readme = generatePipelineReadme();
        await db.pipelines.readme.create(readme);
        const promise = db.pipelines.readme.create(readme);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch readme', async () => {
        const readme = generatePipelineReadme();
        const res1 = await db.pipelines.readme.create(readme);
        const res2 = await db.pipelines.readme.fetch({ name: readme.name });
        expect(res1).to.eql(res2);
    });
    it('should create and update readme', async () => {
        const readme = generatePipelineReadme();
        const name = readme.name;
        const params = { data: 'the readme file|string' };
        await db.pipelines.readme.create(readme);
        await db.pipelines.readme.update({ ...params, name });
        const res = await db.pipelines.readme.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and patch readme', async () => {
        const readme = generatePipelineReadme();
        const name = readme.name;
        const params = { isMain: true };
        await db.pipelines.readme.create(readme);
        await db.pipelines.readme.patch({ ...params, name });
        const res = await db.pipelines.readme.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and fetch readme list', async () => {
        const readme1 = generatePipelineReadme();
        const readme2 = generatePipelineReadme();
        const readme3 = generatePipelineReadme();
        await db.pipelines.readme.create(readme1);
        await db.pipelines.readme.create(readme2);
        await db.pipelines.readme.create(readme3);
        const list = await db.pipelines.readme.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
