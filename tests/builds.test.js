const { expect } = require('chai');
const connect = require('./connect');
const { generateAlgorithm, generateBuild } = require('./common');

describe('Builds', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        const promise = db.algorithms.builds.fetch({
            buildId: build.buildId,
        });
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        await db.algorithms.builds.create(build);
        const promise = db.algorithms.builds.create(build);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch build', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        const res = await db.algorithms.builds.fetch(build1);
        expect(res).to.eql(build1);
    });
    it('should create and update build', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        const status = 'completed';
        await db.algorithms.builds.create(build);
        await db.algorithms.builds.update({
            ...build,
            status,
        });
        const res = await db.algorithms.builds.fetch(build);
        expect(res.status).to.eql(status);
    });
    it('should create and delete build', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        await db.algorithms.builds.create(build);
        const res1 = await db.algorithms.builds.fetch(build);
        await db.algorithms.builds.delete(build);
        const promise = db.algorithms.builds.fetch(build);
        expect(res1).to.eql(build);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should create and fetch build list', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        const build3 = generateBuild(algorithm);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        await db.algorithms.builds.create(build3);
        const list = await db.algorithms.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
