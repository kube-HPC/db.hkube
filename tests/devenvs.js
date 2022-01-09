const { expect } = require('chai');
const { generateDevenv } = require('./common');
let db = null;

describe('Devenvs', () => {
    before(async () => {
        db = global.testParams.db;
    });
    beforeEach(async () => {
        await db.devenvs.deleteMany({}, { queryInnerId: false, allowNotFound: true });
    });
    it('should not throw error itemNotFound', async () => {
        const response = await db.devenvs.fetch({name: 'notExist'});
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const devenv = generateDevenv();
        await db.devenvs.create(devenv);
        const promise = db.devenvs.create(devenv);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch devenv', async () => {
        const devenv = generateDevenv();
        const res1 = await db.devenvs.create(devenv);
        const res2 = await db.devenvs.fetch({ name: devenv.name });
        expect(res1).to.eql(res2);
    });
    it('should create and update devenv', async () => {
        const devenv = generateDevenv();
        const name = devenv.name;
        const params = { ttl: 60 };
        await db.devenvs.create(devenv);
        await db.devenvs.update({ ...params, name });
        const res = await db.devenvs.fetch({ name });
        expect(res).to.eql({ ...devenv, ...params });
    });
    it('should create and patch devenv', async () => {
        const devenv = generateDevenv();
        const name = devenv.name;
        const params = { ttl: 60 };
        await db.devenvs.create(devenv);
        await db.devenvs.patch({ ...params, name });
        const res = await db.devenvs.fetch({ name });
        const { key, ...data } = res;
        expect(data).to.eql({ ...devenv, ...params });
    });
    it('should create and delete devenv', async () => {
        const devenv = generateDevenv();
        const name = devenv.name;
        await db.devenvs.create(devenv);
        const res1 = await db.devenvs.fetch({ name });
        const res2 = await db.devenvs.delete({ name });
        const response = await db.devenvs.fetch({ name });
        expect(res1).to.eql(devenv);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
    it('should create and search devenv list', async () => {
        const devenv1 = generateDevenv();
        const devenv2 = generateDevenv();
        const devenv3 = generateDevenv();
        const status = 'creating';
        devenv1.status = status;
        await db.devenvs.create(devenv1);
        await db.devenvs.create(devenv2);
        await db.devenvs.create(devenv3);
        const list = await db.devenvs.search({ status });
        expect(list.length).to.be.gte(1);
    });
    it('should create and fetch devenv list', async () => {
        const devenv1 = generateDevenv();
        const devenv2 = generateDevenv();
        const devenv3 = generateDevenv();
        await db.devenvs.create(devenv1);
        await db.devenvs.create(devenv2);
        await db.devenvs.create(devenv3);
        const list = await db.devenvs.fetchAll();
        expect(list.length).to.eql(3);
    });
});
