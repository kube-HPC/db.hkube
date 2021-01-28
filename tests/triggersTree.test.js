const { expect } = require('chai');
const uuid = require('uuid').v4;
const connect = require('./connect');
const { generateTensorboard } = require('./common');

describe('TriggersTree', () => {
    it('should create and fetch triggers tree', async () => {
        const db = await connect();
        const name = uuid();
        const rootJobId = uuid();
        const rootJobName = name;
        const jobId = uuid();
        const parentJobId = rootJobId;
        await db.triggersTree.update({
            name,
            rootJobName,
            jobId,
            rootJobId,
            parentJobId,
        });
        await db.triggersTree.update({
            name,
            rootJobName,
            jobId: uuid(),
            rootJobId,
            parentJobId: jobId,
        });
        const tree = await db.triggersTree.fetch({ jobId: rootJobId });
        expect(tree).to.have.property('name');
        expect(tree).to.have.property('jobId');
        expect(tree).to.have.property('children');
    });
});
