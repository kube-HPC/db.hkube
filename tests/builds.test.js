const { expect } = require('chai');
const connect = require('./connect');
const { generateAlgorithm, generateBuild } = require('./common');

/** @type {import('../lib/Provider').ProviderInterface} */
let db = null;
describe('Builds', () => {
    before(async () => {
        db = await connect();
    });
    it('should not throw error itemNotFound', async () => {
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        const response = await db.algorithms.builds.fetch({
            buildId: build.buildId,
        });
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        await db.algorithms.builds.create(build);
        const promise = db.algorithms.builds.create(build);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch build', async () => {
        const algorithm = generateAlgorithm();
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        const res = await db.algorithms.builds.fetch(build1);
        expect(res).to.eql(build1);
    });
    it('should create and update build', async () => {
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
    it('should create and patch build', async () => {
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        const status = 'completed';
        await db.algorithms.builds.create(build);
        await db.algorithms.builds.patch({
            ...build,
            status,
        });
        const res = await db.algorithms.builds.fetch(build);
        expect(res.status).to.eql(status);
    });
    it('should create and delete build', async () => {
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        await db.algorithms.builds.create(build);
        const res1 = await db.algorithms.builds.fetch(build);
        const res2 = await db.algorithms.builds.delete(build);
        const response = await db.algorithms.builds.fetch(build);
        expect(res1).to.eql(build);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
    it('should create and fetch build list', async () => {
        const algorithm = generateAlgorithm();
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        const build3 = generateBuild(algorithm);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        await db.algorithms.builds.create(build3);
        const list = await db.algorithms.builds.fetchAll({
            query: { algorithmName: algorithm.name },
        });
        expect(list).to.have.lengthOf(3);
    });
    it('should create and fetch versions with sort asc and limit', async () => {
        const algorithm = generateAlgorithm();
        const build1 = generateBuild(algorithm, 80);
        const build2 = generateBuild(algorithm, 90);
        const build3 = generateBuild(algorithm, 70);
        const build4 = generateBuild(algorithm, 85);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        await db.algorithms.builds.create(build3);
        await db.algorithms.builds.create(build4);
        const res = await db.algorithms.builds.fetchAll({
            query: { algorithmName: algorithm.name },
            fields: { algorithm: false },
            sort: { progress: 'desc' },
            limit: 3,
        });
        expect(res[0]).to.not.have.property('algorithm');
        const bldMap = [build2, build4, build1].map(v => v.progress);
        const resMap = res.map(v => v.progress);
        expect(resMap).to.eql(bldMap);
    });
});
