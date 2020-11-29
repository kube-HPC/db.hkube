const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');
const { generateAlgorithm, generateVersion, generateBuild } = require('./common');

describe('Algorithms', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const promise = db.algorithms.fetch(algorithm);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        await db.algorithms.create(algorithm);
        const promise = db.algorithms.create(algorithm);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch algorithm', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const res1 = await db.algorithms.create(algorithm);
        const res2 = await db.algorithms.fetch({ name: algorithm.name });
        expect(res1).to.eql(res2);
    });
    it('should create and fetch many', async () => {
        const db = await connect();
        const cpu = Math.random() * 1000;
        const algorithm1 = generateAlgorithm({ cpu });
        const algorithm2 = generateAlgorithm({ cpu });
        const algorithm3 = generateAlgorithm({ cpu });
        const res1 = await db.algorithms.createMany([algorithm1, algorithm2, algorithm3]);
        const res2 = await db.algorithms.fetchAll({ query: { cpu } });
        expect(res1.inserted).to.eql(res2.length);
    });
    it('should create and update algorithm', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const name = algorithm.name;
        const params = { cpu: 2, mem: '512Mi' };
        await db.algorithms.create(algorithm);
        await db.algorithms.update({ ...params, name });
        const res = await db.algorithms.fetch({ name });
        expect(res).to.eql({ ...algorithm, ...params });
    });
    it('should create and patch algorithm', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const name = algorithm.name;
        const params = { cpu: 2, mem: '512Mi' };
        await db.algorithms.create(algorithm);
        await db.algorithms.patch({ ...params, name });
        const res = await db.algorithms.fetch({ name });
        expect(res).to.eql({ ...algorithm, ...params });
    });
    it('should create and delete algorithm with dependencies', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const name = algorithm.name;
        const version1 = generateVersion(algorithm);
        const version2 = generateVersion(algorithm);
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);

        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);

        const res1 = await db.algorithms.fetch({ name });
        const versions1 = await db.algorithms.versions.fetchAll({ query: { name } });
        const builds1 = await db.algorithms.builds.fetchAll({ query: { algorithmName: name } });
        const res2 = await db.algorithms.delete({ name });
        const versions2 = await db.algorithms.versions.fetchAll({ query: { name } });
        const builds2 = await db.algorithms.builds.fetchAll({ query: { algorithmName: name } });
        const promise = db.algorithms.fetch({ name });
        expect(versions1).to.have.lengthOf(2);
        expect(builds1).to.have.lengthOf(2);
        expect(versions2).to.have.lengthOf(0);
        expect(builds2).to.have.lengthOf(0);
        expect(res1).to.eql(algorithm);
        expect(res2).to.eql({ deleted: 5 });
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should create and fetch algorithm list by query', async () => {
        const db = await connect();
        const algorithm1 = generateAlgorithm({ cpu: 7, env: 'nodejs' });
        const algorithm2 = generateAlgorithm({ cpu: 5, env: 'nodejs' });
        const algorithm3 = generateAlgorithm({ cpu: 9, env: 'nodejs' });
        const algorithm4 = generateAlgorithm({ cpu: 8, env: 'nodejs' });
        await db.algorithms.create(algorithm1);
        await db.algorithms.create(algorithm2);
        await db.algorithms.create(algorithm3);
        await db.algorithms.create(algorithm4);
        const list = await db.algorithms.fetchAll({
            query: { env: 'nodejs' },
            sort: { cpu: 'desc' },
            limit: 3,
        });
        expect(list).to.have.lengthOf(3);
        expect(list[0].cpu).to.eql(9);
    });
    it('should create and fetch algorithm count', async () => {
        const db = await connect();
        const env = `env-${uuid.v4()}`;
        const algorithm1 = generateAlgorithm({ env });
        const algorithm2 = generateAlgorithm({ env });
        const algorithm3 = generateAlgorithm({ env });
        const algorithm4 = generateAlgorithm({ env });
        await db.algorithms.create(algorithm1);
        await db.algorithms.create(algorithm2);
        await db.algorithms.create(algorithm3);
        await db.algorithms.create(algorithm4);
        const list = await db.algorithms.count({ query: { env } });
        expect(list).to.eql(4);
    });
});
