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
    it('should create and fetch graph', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchGraph({ jobId });
        expect(res).to.eql({ jobId, ...job.graph });
    });
    it('should create and fetch status', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchStatus({ jobId });
        expect(res).to.eql({ jobId, ...job.status });
    });
    it('should create and fetch result', async () => {
        const db = await connect();
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchResult({ jobId });
        expect(res).to.eql({ jobId, ...job.result });
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
    it('should fetch running job by multi params', async () => {
        const db = await connect();
        const job = generateJob();
        const { result, ...jobData } = job;
        const { experimentName, name: pipelineName } = jobData.pipeline;
        const pipelineType = jobData.pipeline.types[1];
        const algorithmName = jobData.pipeline.nodes[1].algorithmName;
        await db.jobs.create(jobData);
        const response = await db.jobs.fetchByParams({
            experimentName,
            pipelineName,
            pipelineType,
            algorithmName,
            isRunning: true,
        });
        expect(response).to.have.lengthOf(1);
        expect(response[0]).to.eql(jobData);
    });
    it('should fetch not running job by multi params', async () => {
        const db = await connect();
        const jobData = generateJob();
        const { experimentName, name: pipelineName } = jobData.pipeline;
        const pipelineType = jobData.pipeline.types[1];
        const algorithmName = jobData.pipeline.nodes[1].algorithmName;
        await db.jobs.create(jobData);
        const response = await db.jobs.fetchByParams({
            experimentName,
            pipelineName,
            pipelineType,
            algorithmName,
            isRunning: false,
        });
        expect(response).to.have.lengthOf(1);
        expect(response[0]).to.eql(jobData);
    });
    it('should create and update result', async () => {
        const db = await connect();
        const jobData = generateJob();
        const { result, ...job } = jobData;
        const { jobId } = job;
        const status = 'completed';
        await db.jobs.create(job);
        await db.jobs.updateResult({ jobId, status });
        const res = await db.jobs.fetch({ jobId });
        expect(res.result.status).to.eql(status);
    });
    it('should create and update status', async () => {
        const db = await connect();
        const jobData = generateJob();
        const { status, ...job } = jobData;
        const { jobId } = job;
        const level = 'info';
        await db.jobs.create(job);
        await db.jobs.updateStatus({ jobId, level });
        const res = await db.jobs.fetch({ jobId });
        expect(res.status.level).to.eql(level);
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
