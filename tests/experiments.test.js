const { expect } = require('chai');
const { generateExperiment } = require('./common');
let db = null;

describe('Experiments', () => {
    before(async () => {
        db = global.testParams.db;
    });
    it('should not throw error itemNotFound', async () => {
        const response = await db.experiments.fetch({ name: 'no_such' });
        expect(response).to.be.null;
    });
    it('should create and fetch experiment', async () => {
        const experiment = generateExperiment();
        await db.experiments.create(experiment);
        const res = await db.experiments.fetch(experiment);
        expect(res).to.eql(experiment);
    });
    it('should create and update experiment', async () => {
        const experiment = generateExperiment();
        const name = experiment.name;
        const description = 'just it';
        await db.experiments.create(experiment);
        await db.experiments.update({
            name,
            description,
            newField: [1, false, 4, 'fff'],
        });
        const res = await db.experiments.fetch({ name });
        expect(res.description).to.eql(description);
    });
    it('should create and delete experiment', async () => {
        const experiment = generateExperiment();
        const name = experiment.name;
        await db.experiments.create(experiment);
        const res1 = await db.experiments.fetch({ name });
        const res2 = await db.experiments.delete({ name });
        const response = await db.experiments.fetch({ name });
        expect(res1).to.eql(experiment);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
    it('should create and fetch version list', async () => {
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
