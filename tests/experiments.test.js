const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');

const generateExperiment = () => ({
    name: uuid.v4(),
    description: 'this is new description for new experiment',
});

describe('Experiments', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const promise = db.experiments.fetch({ name: 'no_such' });
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should create and fetch experiment', async () => {
        const db = await connect();
        const experiment = generateExperiment();
        await db.experiments.create(experiment);
        const res = await db.experiments.fetch(experiment);
        expect(res).to.eql(experiment);
    });
    it('should create and update experiment', async () => {
        const db = await connect();
        const experiment = generateExperiment();
        const name = experiment.name;
        const description = 'just it';
        await db.experiments.create(experiment);
        await db.experiments.update({ name, description, newField: [1, false, 4, 'fff'] });
        const res = await db.experiments.fetch({ name });
        expect(res.description).to.eql(description);
    });
    it('should create and delete experiment', async () => {
        const db = await connect();
        const experiment = generateExperiment();
        await db.experiments.create(experiment);
        const res = await db.experiments.delete(experiment);
        const promise = db.experiments.fetch({ name: experiment.name });
        expect(res).to.eql({ deleted: 1 });
        await expect(promise).to.be.rejectedWith(/could not find version/i);
    });
    it.skip('should upsert and update version', async () => {
        const db = await connect();
        const experiment = generateExperiment();
        await db.experiments.update(experiment);
        const res = await db.experiments.fetch({ name: experiment.name });
        expect(res).to.eql({ ...algorithm, ...params });
    });
    it('should create and fetch version list', async () => {
        const db = await connect();
        const experiment1 = generateExperiment();
        const experiment2 = generateExperiment();
        const experiment3 = generateExperiment();
        await db.experiments.create(experiment1);
        await db.experiments.create(experiment2);
        await db.experiments.create(experiment3);
        const list = await db.experiments.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
