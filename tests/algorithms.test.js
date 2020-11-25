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
    it('should throw inclusion cannot be mixed with exclusion', async () => {
        const db = await connect();
        const cpu = Math.random() * 1000;
        const promise = db.algorithms.fetchAll({
            query: { cpu },
            excluded: ['builds'],
            included: ['versions'],
        });
        await expect(promise).to.be.rejectedWith('inclusion cannot be mixed with exclusion');
    });
    it('should create and fetch many', async () => {
        const db = await connect();
        const cpu = Math.random() * 1000;
        const algorithm1 = generateAlgorithm({ cpu });
        const algorithm2 = generateAlgorithm({ cpu });
        const algorithm3 = generateAlgorithm({ cpu });
        const res1 = await db.algorithms.createMany([algorithm1, algorithm2, algorithm3]);
        const res2 = await db.algorithms.fetchAll({ query: { cpu } });
        expect(res1).to.eql(res2.length);
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
    it('should create and delete algorithm', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const name = algorithm.name;
        const res1 = await db.algorithms.create(algorithm);
        const res2 = await db.algorithms.fetch({ name });
        const res3 = await db.algorithms.delete({ name });
        const promise = db.algorithms.fetch({ name });
        expect(res1).to.eql(res2);
        expect(res3).to.eql({ deleted: 1 });
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should upsert and update algorithm', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const name = algorithm.name;
        const params = { cpu: 2, mem: '512Mi' };
        await db.algorithms.update(algorithm);
        await db.algorithms.update({ ...params, name });
        const res = await db.algorithms.fetch({ name });
        expect(res).to.eql({ ...algorithm, ...params });
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
    it('should create and get algorithm without version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm);
        const version2 = generateVersion(algorithm);
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        algorithm.version = version1.version;
        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        const res = await db.algorithms.fetchAll({
            query: { name: algorithm.name },
            excluded: ['versions', 'builds'],
        });
        expect(res[0]).to.not.have.property('versions');
        expect(res[0]).to.not.have.property('builds');
    });
});
