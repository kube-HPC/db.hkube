const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');

const generateAlgorithm = () => ({
    name: `alg-${uuid.v4()}`,
    algorithmImage: `hkube/algorithm-${uuid.v4()}`,
    cpu: 1,
    mem: '256Mi',
    options: {
        debug: false,
        pending: false,
    },
    minHotWorkers: 0,
    type: 'Image',
});

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
    it('should create and fetch algorithm list', async () => {
        const db = await connect();
        const algorithm1 = generateAlgorithm();
        const algorithm2 = generateAlgorithm();
        const algorithm3 = generateAlgorithm();
        await db.algorithms.create(algorithm1);
        await db.algorithms.create(algorithm2);
        await db.algorithms.create(algorithm3);
        const list = await db.algorithms.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
