const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');

const generateAlgorithm = options => ({
    name: `alg-${uuid.v4()}`,
    algorithmImage: `hkube/algorithm-${uuid.v4()}`,
    cpu: options?.cpu || 1,
    mem: '256Mi',
    options: {
        debug: false,
        pending: false,
    },
    minHotWorkers: 0,
    type: 'Image',
});

const generateVersion = algorithm => {
    const version = uuid.v4();
    return {
        version,
        name: algorithm.name,
        semver: '1.0.0',
        created: Date.now(),
        algorithm: { ...algorithm, version },
    };
};

const generateBuild = algorithm => {
    const buildId = uuid.v4();
    return {
        buildId: buildId,
        imageTag: 'lfhge07l',
        algorithm,
        env: 'python',
        fileExt: 'zip',
        filePath: 'cicd-hkube-builds/test1-wds86s',
        algorithmName: algorithm.name,
        type: 'Code',
        status: 'active',
        progress: 60,
        error: null,
        trace: null,
        endTime: null,
        startTime: 1606063275506,
        data: null,
        timestamp: 1606063281438,
    };
};

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
        const res1 = await db.algorithms.createMany([
            algorithm1,
            algorithm2,
            algorithm3,
        ]);
        const res2 = await db.algorithms.fetchAll({ cpu });
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
        expect(res3).to.eql(name);
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
describe('Versions', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const version = generateVersion(algorithm);
        const promise = db.algorithms.versions.fetch(version);
        await expect(promise).to.be.rejectedWith(/could not find/i);
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
        });
        const res1 = await db.algorithms.versions.fetch({ name, version });
        await db.algorithms.versions.update({
            name,
            version,
            tags: tags2,
        });
        const res2 = await db.algorithms.versions.fetch({ name, version });
        expect(res1.tags).to.eql(tags1);
        expect(res2.tags).to.eql(tags2);
    });
    it('should create and get algorithm without version', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const newVersion1 = generateVersion(algorithm);
        const newVersion2 = generateVersion(algorithm);
        algorithm.version = newVersion1.version;
        await db.algorithms.create(algorithm);
        await db.algorithms.versions.create(newVersion1);
        await db.algorithms.versions.create(newVersion2);
        const res = await db.algorithms.fetchAll(
            { name: algorithm.name },
            { excluded: ['versions'] }
        );
        expect(res[0]).to.not.have.property('versions');
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
describe('Builds', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        const promise = db.algorithms.builds.fetch(build);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should create and fetch build', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        await db.algorithms.create(algorithm);
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
        await db.algorithms.create(algorithm);
        await db.algorithms.builds.create(build);
        await db.algorithms.builds.update({
            ...build,
            status,
        });
        const res = await db.algorithms.builds.fetch(build);
        expect(res.status).to.eql(status);
    });
    it.skip('should create and delete build', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build = generateBuild(algorithm);
        await db.algorithms.create(algorithm);
        await db.algorithms.builds.create(build);
        const res1 = await db.algorithms.builds.fetch(build);
        await db.algorithms.builds.delete(build);
        const promise = db.algorithms.builds.fetch(build);
        expect(res1).to.eql(res2);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should create and fetch build list', async () => {
        const db = await connect();
        const algorithm = generateAlgorithm();
        const build1 = generateBuild(algorithm);
        const build2 = generateBuild(algorithm);
        const build3 = generateBuild(algorithm);
        await db.algorithms.create(algorithm);
        await db.algorithms.builds.create(build1);
        await db.algorithms.builds.create(build2);
        await db.algorithms.builds.create(build3);
        const list = await db.algorithms.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
