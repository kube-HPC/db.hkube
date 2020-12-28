const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');
const {
    generateAlgorithm,
    generateVersion,
    generateBuild,
    generateAlgorithmReadme,
} = require('./common');

describe('Algorithms', () => {
    it('should not throw error itemNotFound', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const response = await db.algorithms.fetch(algorithm);
        expect(response).to.be.null;
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
    it('should create many', async () => {
        const db = await connect();
        const cpu = Math.random() * 1000;
        const algorithm1 = generateAlgorithm({ cpu });
        const algorithm2 = generateAlgorithm({ cpu });
        const algorithm3 = generateAlgorithm({ cpu });
        const res1 = await db.algorithms.createMany([algorithm1, algorithm2, algorithm3]);
        const res2 = await db.algorithms.fetchAll({ query: { cpu } });
        expect(res1.inserted).to.eql(res2.length);
    });
    it.skip('should update many', async () => {
        const db = await connect();
        const cpu = Math.random() * 1000;
        const algorithm1 = generateAlgorithm({ cpu });
        const algorithm2 = generateAlgorithm({ cpu });
        const res1 = await db.algorithms.createMany([algorithm1, algorithm2]);
        algorithm1.cpu = 5;
        algorithm2.cpu = 5;
        const res2 = await db.algorithms.updateMany([algorithm1, algorithm2]);
        const res3 = await db.algorithms.fetchAll({ query: { cpu } });
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
    it('should create and patch nested prop', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const name = algorithm.name;
        const params = { name, options: { debug: true } };
        await db.algorithms.create(algorithm);
        await db.algorithms.patch(params);
        const res = await db.algorithms.fetch({ name });
        expect(res.options.debug).to.eql(true);
        expect(res.options.pending).to.eql(false);
    });
    it('should create and delete algorithm with dependencies', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm);
        const version2 = generateVersion(algorithm);
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        const readme = generateAlgorithmReadme(algorithm);

        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        await db.algorithms.readme.create(readme);

        const res = await db.algorithms.delete({ name: algorithm.name });
        expect(res).to.eql({ algorithms: 1, versions: 2, builds: 2, readme: 1 });
    });
    it('should create and search algorithms', async () => {
        const db = await connect();
        const algorithm1 = generateAlgorithm({ name: `alg-green-${uuid.v4()}` });
        const algorithm2 = generateAlgorithm({ name: `alg-blue-${uuid.v4()}` });
        const algorithm3 = generateAlgorithm({ name: `alg-green-${uuid.v4()}` });
        await db.algorithms.create(algorithm1);
        await db.algorithms.create(algorithm2);
        await db.algorithms.create(algorithm3);
        const list1 = await db.algorithms.search({
            name: 'green',
        });
        const list2 = await db.algorithms.search({
            name: 'blue',
        });
        expect(list1.length).to.be.greaterThan(0);
        expect(list2.length).to.be.greaterThan(0);
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
