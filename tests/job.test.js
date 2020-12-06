const { expect } = require('chai');
const connect = require('./connect');
const { generateJob, generateGraph } = require('./common');

describe('Jobs', () => {
    it('should not throw error itemNotFound', async () => {
        const db = await connect();
        const response = await db.jobs.fetch({ jobId: 'no_such' });
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const job = generateJob();
        await db.jobs.create(job);
        const promise = db.jobs.create(job);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch job', async () => {
        const db = await connect();
        const job = generateJob();
        const res1 = await db.jobs.create(job);
        const res2 = await db.jobs.fetch({ jobId: job.jobId });
        expect(res1).to.eql(res2);
    });
    it('should create and fetch job graph', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchGraph({ jobId });
        expect(res).to.eql({ jobId, ...job.graph });
    });
    it('should create and fetch job status', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchStatus({ jobId });
        expect(res).to.eql({ jobId, ...job.status });
    });
    it('should create and fetch job result', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchResult({ jobId });
        expect(res).to.eql({ jobId, ...job.result });
    });
    it('should create and update job graph', async () => {
        const db = await connect();
        const job = generateJob();
        const graph = generateGraph();
        const { jobId } = job;
        await db.jobs.create(job);
        await db.jobs.update({ jobId, graph });
        const res = await db.jobs.fetch({ jobId });
        expect(res).to.eql({ ...job, graph });
    });
    it('should create and delete job', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res1 = await db.jobs.fetch({ jobId });
        const res2 = await db.jobs.delete({ jobId });
        const response = await db.jobs.fetch({ jobId });
        expect(res1).to.eql(job);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
    it('should create and patch job status', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        const level = 'error';
        const error = 'there was an exception';
        await db.jobs.create(job);
        await db.jobs.patch({ jobId, status: { level, error } });
        const res = await db.jobs.fetch({ jobId });
        expect(res.status.level).to.eql(level);
        expect(res.status.error).to.eql(error);
        expect(res.status.data).to.eql(job.status.data);
    });
    it('should create and update job result', async () => {
        const db = await connect();
        const jobData = generateJob();
        const { result, ...job } = jobData;
        const { jobId } = job;
        const status = 'completed';
        await db.jobs.create(job);
        await db.jobs.update({ jobId, result: { status } });
        const res = await db.jobs.fetch({ jobId });
        expect(res.result.status).to.eql(status);
    });
    it('should create and fetch job list', async () => {
        const db = await connect();
        const job1 = generateJob();
        const job2 = generateJob();
        const job3 = generateJob();
        await db.jobs.create(job1);
        await db.jobs.create(job2);
        await db.jobs.create(job3);
        const list = await db.jobs.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
});
