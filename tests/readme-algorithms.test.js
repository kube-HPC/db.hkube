const { expect } = require('chai');
const connect = require('./connect');
const { generateAlgorithmReadme } = require('./common');

describe('ReadAlgorithms', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const readme = generateAlgorithmReadme();
        const promise = db.readme.algorithms.fetch(readme);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const readme = generateAlgorithmReadme();
        await db.readme.algorithms.create(readme);
        const promise = db.readme.algorithms.create(readme);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch readme', async () => {
        const db = await connect();
        const readme = generateAlgorithmReadme();
        const res1 = await db.readme.algorithms.create(readme);
        const res2 = await db.readme.algorithms.fetch({ name: readme.name });
        expect(res1).to.eql(res2);
    });
    it('should create and update readme', async () => {
        const db = await connect();
        const readme = generateAlgorithmReadme();
        const name = readme.name;
        const params = { data: 'the readme file|string' };
        await db.readme.algorithms.create(readme);
        await db.readme.algorithms.update({ ...params, name });
        const res = await db.readme.algorithms.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and patch readme', async () => {
        const db = await connect();
        const readme = generateAlgorithmReadme();
        const name = readme.name;
        const params = { isMain: true };
        await db.readme.algorithms.create(readme);
        await db.readme.algorithms.patch({ ...params, name });
        const res = await db.readme.algorithms.fetch({ name });
        expect(res).to.eql({ ...readme, ...params });
    });
    it('should create and fetch readme list', async () => {
        const db = await connect();
        const readme1 = generateAlgorithmReadme();
        const readme2 = generateAlgorithmReadme();
        const readme3 = generateAlgorithmReadme();
        await db.readme.algorithms.create(readme1);
        await db.readme.algorithms.create(readme2);
        await db.readme.algorithms.create(readme3);
        const list = await db.readme.algorithms.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
