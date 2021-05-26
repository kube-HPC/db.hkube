const { expect } = require('chai');
const { generateAlgorithm, generateVersion } = require('./common');
let db = null;

describe('Versions', () => {
    before(async () => {
        db = global.testParams.db;
    });
    it('should not throw error itemNotFound', async () => {
        const algorithm = generateAlgorithm();
        const version = generateVersion(algorithm);
        const response = await db.algorithms.versions.fetch(version);
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const algorithm = generateAlgorithm();
        const version = generateVersion(algorithm);
        await db.algorithms.versions.create(version);
        const promise = db.algorithms.versions.create(version);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch version', async () => {
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm);
        const version2 = generateVersion(algorithm);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        const res = await db.algorithms.versions.fetch(version1);
        expect(res).to.eql(version1);
    });
    it('should create and fetch versions with sort asc and limit', async () => {
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm, 3);
        const version2 = generateVersion(algorithm, 4);
        const version3 = generateVersion(algorithm, 1);
        const version4 = generateVersion(algorithm, 2);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        await db.algorithms.versions.create(version3);
        await db.algorithms.versions.create(version4);
        const res = await db.algorithms.versions.fetchAll({
            query: { name: algorithm.name },
            fields: { algorithm: false },
            sort: { semver: 'asc' },
            limit: 3,
        });
        expect(res[0]).to.not.have.property('algorithm');
        const verMap = [version3, version4, version1].map(v => v.semver);
        const resMap = res.map(v => v.semver);
        expect(resMap).to.eql(verMap);
    });
    it('should create and fetch versions with sort desc and limit', async () => {
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm, 3);
        const version2 = generateVersion(algorithm, 4);
        const version3 = generateVersion(algorithm, 1);
        const version4 = generateVersion(algorithm, 2);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        await db.algorithms.versions.create(version3);
        await db.algorithms.versions.create(version4);
        const res = await db.algorithms.versions.fetchAll({
            query: { name: algorithm.name },
            fields: { algorithm: false },
            sort: { semver: 'desc' },
            limit: 3,
        });
        expect(res[0]).to.not.have.property('algorithm');
        const verMap = [version2, version1, version4].map(v => v.semver);
        const resMap = res.map(v => v.semver);
        expect(resMap).to.eql(verMap);
    });
    it('should create and update version', async () => {
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
    it('should create and patch version', async () => {
        const algorithm = generateAlgorithm();
        const newVersion = generateVersion(algorithm);
        const { name, version } = newVersion;
        const tags = ['great', 'fast'];
        await db.algorithms.versions.create(newVersion);
        await db.algorithms.versions.patch({
            name,
            version,
            tags,
            pinned: true,
        });
        const res = await db.algorithms.versions.fetch({ name, version });
        expect(res.tags).to.eql(tags);
        expect(res.pinned).to.eql(true);
    });
    it('should create and delete version', async () => {
        const algorithm = generateAlgorithm();
        const version = generateVersion(algorithm);
        algorithm.version = version.version;
        await db.algorithms.versions.create(version);
        const res1 = await db.algorithms.versions.fetch(version);
        const res2 = await db.algorithms.versions.delete(version);
        const response = await db.algorithms.versions.fetch(version);
        expect(res1).to.eql(version);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
});
