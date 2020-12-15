const { expect } = require('chai');
const connect = require('./connect');
const { generatePipelineDriver } = require('./common');

describe('PipelineDrivers', () => {
    it('should not throw error itemNotFound', async () => {
        const db = await connect();
        const response = await db.pipelineDrivers.fetch({ name: 'no_such' });
        expect(response).to.be.null;
    });
    it('should create and fetch pipelineDriver', async () => {
        const db = await connect();
        const pipelineDriver = generatePipelineDriver();
        await db.pipelineDrivers.create(pipelineDriver);
        const res = await db.pipelineDrivers.fetch(pipelineDriver);
        expect(res).to.eql(pipelineDriver);
    });
    it('should create and update pipelineDriver', async () => {
        const db = await connect();
        const pipelineDriver = generatePipelineDriver();
        const name = pipelineDriver.name;
        const cpu = 5;
        await db.pipelineDrivers.create(pipelineDriver);
        await db.pipelineDrivers.update({ name, cpu });
        const res = await db.pipelineDrivers.fetch({ name });
        expect(res.cpu).to.eql(cpu);
    });
    it('should create and delete pipelineDriver', async () => {
        const db = await connect();
        const pipelineDriver = generatePipelineDriver();
        const name = pipelineDriver.name;
        await db.pipelineDrivers.create(pipelineDriver);
        const res1 = await db.pipelineDrivers.fetch({ name });
        const res2 = await db.pipelineDrivers.delete({ name });
        const response = await db.pipelineDrivers.fetch({ name });
        expect(res1).to.eql(pipelineDriver);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
    it('should create and fetch version list', async () => {
        const db = await connect();
        const pipelineDriver1 = generatePipelineDriver();
        const pipelineDriver2 = generatePipelineDriver();
        const pipelineDriver3 = generatePipelineDriver();
        await db.pipelineDrivers.create(pipelineDriver1);
        await db.pipelineDrivers.create(pipelineDriver2);
        await db.pipelineDrivers.create(pipelineDriver3);
        const list = await db.pipelineDrivers.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
