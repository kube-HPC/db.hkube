const { expect } = require('chai');
const { generateGateway } = require('./common');
const uuid = require('uuid').v4;
let db = null;

describe('Gateways', () => {
    before(async () => {
        db = global.testParams.db;
    });
    it('should not throw error itemNotFound', async () => {
        const response = await db.gateways.fetch({ name: 'no_such' });
        expect(response).to.be.null;
    });
    it('should create and fetch gateway', async () => {
        const gateway = generateGateway();
        await db.gateways.create(gateway);
        const res = await db.gateways.fetch(gateway);
        expect(res).to.eql(gateway);
        const res2 = await db.gateways.search({ jobId: gateway.jobId, nodeName: gateway.nodeName });
        expect(res2[0]).to.eql(gateway);
    });
    it('should create and update gateway', async () => {
        const nodeName = uuid();
        const jobId = uuid();
        const gateway = generateGateway();
        const name = gateway.name;
        const description = 'just it';
        await db.gateways.create(gateway);
        await db.gateways.update({
            name,
            description,
            newField: [1, false, 4, 'fff'],
        });
        const res = await db.gateways.fetch({ name });
        expect(res.description).to.eql(description);
    });
    it('should create and delete gateway', async () => {
        const gateway = generateGateway();
        const name = gateway.name;
        await db.gateways.create(gateway);
        const res1 = await db.gateways.fetch({ name });
        const res2 = await db.gateways.deleteByJob({ jobId: gateway.jobId });
        const response = await db.gateways.fetch({ name });
        expect(res1).to.eql(gateway);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
    it('should create and fetch version list', async () => {
        const gateway1 = generateGateway();
        const gateway2 = generateGateway();
        const gateway3 = generateGateway();
        await db.gateways.create(gateway1);
        await db.gateways.create(gateway2);
        await db.gateways.create(gateway3);
        const list = await db.gateways.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
