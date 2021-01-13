const { expect } = require('chai');
const connect = require('./connect');
const { generateAlgorithmReadme } = require('./common');

/** @type {import('../lib/Provider').ProviderInterface} */
let db = null;

describe('ReadAlgorithms', () => {
    before(async () => {
        db = await connect();
    });
    it('should not throw error itemNotFound', async () => {
        const readme = generateAlgorithmReadme();
        const response = await db.algorithms.readme.fetch(readme);
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const readme = generateAlgorithmReadme();
        await db.algorithms.readme.create(readme);
        const promise = db.algorithms.readme.create(readme);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch readme', async () => {
        const readme = generateAlgorithmReadme();
        const res1 = await db.algorithms.readme.create(readme);
        const res2 = await db.algorithms.readme.fetch({ name: readme.name });
        expect(res1).to.eql(res2);
    });
    it('should create and update readme', async () => {
        const readme = generateAlgorithmReadme();
        const name = readme.name;
        const params = { data: 'the readme file|string' };
        await db.algorithms.readme.create(readme);
        await db.algorithms.readme.update({ ...params, name });
        const res = await db.algorithms.readme.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and patch readme', async () => {
        const readme = generateAlgorithmReadme();
        const name = readme.name;
        const params = { isMain: true };
        await db.algorithms.readme.create(readme);
        await db.algorithms.readme.patch({ ...params, name });
        const res = await db.algorithms.readme.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and fetch readme list', async () => {
        const readme1 = generateAlgorithmReadme();
        const readme2 = generateAlgorithmReadme();
        const readme3 = generateAlgorithmReadme();
        await db.algorithms.readme.create(readme1);
        await db.algorithms.readme.create(readme2);
        await db.algorithms.readme.create(readme3);
        const list = await db.algorithms.readme.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
