const { expect } = require('chai');
const connect = require('./connect');
const { generateAlgorithm, generateVersion } = require('./common');

describe('Versions', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version = generateVersion(algorithm);
        const promise = db.algorithms.versions.fetch(version);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should throw could not find algorithm', async () => {
        const db = await connect();
        const promise = db.algorithms.versions.delete({ name: 'no_such' });
        await expect(promise).to.be.rejectedWith(/could not find algorithm/i);
    });
    it('should throw could not find version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        await db.algorithms.create(algorithm);
        const promise = db.algorithms.versions.delete({
            name: algorithm.name,
            version: 'no_such',
        });
        await expect(promise).to.be.rejectedWith(/could not find version/i);
    });
    it('should create and fetch version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm);
        const version2 = generateVersion(algorithm);
        algorithm.version = version1.version;
        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        const res = await db.algorithms.versions.fetch(version1);
        expect(res).to.eql(version1);
    });
    it('should create and fetch versions', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm);
        const version2 = generateVersion(algorithm);
        const version3 = generateVersion(algorithm);
        algorithm.version = version1.version;
        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        await db.algorithms.versions.create(version3);
        const res = await db.algorithms.versions.getList({
            name: algorithm.name,
        });
        expect(res).to.eql([version1, version2, version3]);
    });
    it('should create and update version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm({ cpu: 100 });
        const newVersion = generateVersion(algorithm);
        const { name, version } = newVersion;
        const tags1 = ['great', 'fast'];
        const tags2 = ['what'];
        algorithm.version = newVersion.version;
        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(newVersion);
        await db.algorithms.versions.update({
            name,
            version,
            tags: tags1,
            pinned: true,
        });
        const res1 = await db.algorithms.versions.fetch({ name, version });
        await db.algorithms.versions.update({
            name,
            version,
            tags: tags2,
            pinned: false,
        });
        const res2 = await db.algorithms.versions.fetch({ name, version });
        expect(res1.tags).to.eql(tags1);
        expect(res1.pinned).to.eql(true);
        expect(res2.tags).to.eql(tags2);
        expect(res2.pinned).to.eql(false);
    });
    it('should create and delete version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version = generateVersion(algorithm);
        algorithm.version = version.version;
        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(version);
        const res1 = await db.algorithms.versions.fetch(version);
        const res2 = await db.algorithms.versions.delete(version);
        const promise = db.algorithms.versions.fetch(version);
        expect(res1).to.eql(version);
        expect(res2).to.eql({ deleted: 1 });
        await expect(promise).to.be.rejectedWith(/could not find version/i);
    });
    it('should upsert and update version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const name = algorithm.name;
        const params = { cpu: 2, mem: '512Mi' };
        await db.algorithms.update(algorithm);
        await db.algorithms.update({ ...params, name });
        const res = await db.algorithms.fetch({ name });
        expect(res).to.eql({ ...algorithm, ...params });
    });
    it('should create and fetch version list', async () => {
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
