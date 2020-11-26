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
    it('should throw conflict error', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version = generateVersion(algorithm);
        await db.algorithms.versions.create(version);
        const promise = db.algorithms.versions.create(version);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version1 = generateVersion(algorithm);
        const version2 = generateVersion(algorithm);
        await db.algorithms.versions.create(version1);
        await db.algorithms.versions.create(version2);
        const res = await db.algorithms.versions.fetch(version1);
        expect(res).to.eql(version1);
    });
    it('should create and fetch versions with sort asc and limit', async () => {
        const db = await connect();
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
        const verMap = [version3, version4, version1].map(v => v.semver).sort();
        const resMap = res.map(v => v.semver).sort();
        expect(resMap).to.eql(verMap);
    });
    it('should create and fetch versions with sort desc and limit', async () => {
        const db = await connect();
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
        const verMap = [version2, version1, version4].map(v => v.semver).sort();
        const resMap = res.map(v => v.semver).sort();
        expect(resMap).to.eql(verMap);
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
    it('should create and update version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm({ cpu: 100 });
        const newVersion = generateVersion(algorithm);
        const { name, version } = newVersion;
        const tags = ['great', 'fast'];
        algorithm.version = newVersion.version;
        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(newVersion);
        await db.algorithms.versions.patch({
            name,
            version,
            tags,
            pinned: false,
        });
        const res = await db.algorithms.versions.fetch({ name, version });
        expect(res.tags).to.eql(tags);
        expect(res.pinned).to.eql(false);
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
});
