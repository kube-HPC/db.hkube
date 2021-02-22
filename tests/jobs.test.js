const { pipelineStatuses } = require('@hkube/consts');
const { expect } = require('chai');
const { promisify } = require('util');
const connect = require('./connect');
const { doneStatus } = require('./../lib/MongoDB/Jobs');
const { generateJob, generateDataSourceJob } = require('./common');
/** @type {import('../lib/Provider').ProviderInterface} */
let db = null;
const sleep = promisify(setTimeout);

describe('Jobs', () => {
    before(async () => {
        db = await connect();
    });
    it('should not throw error itemNotFound', async () => {
        const response = await db.jobs.fetch({ jobId: 'no_such' });
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const job = generateJob();
        await db.jobs.create(job);
        const promise = db.jobs.create(job);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch job', async () => {
        const job = generateJob();
        const res1 = await db.jobs.create(job);
        const res2 = await db.jobs.fetch({ jobId: job.jobId });
        expect(res1).to.eql(res2);
    });
    it('should create and fetch status', async () => {
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchStatus({ jobId });
        expect(res).to.eql({ jobId, ...job.status });
    });
    it('should create and fetch result', async () => {
        const job = generateJob();
        const { jobId } = job;
        await db.jobs.create(job);
        const res = await db.jobs.fetchResult({ jobId });
        expect(res).to.eql({ jobId, ...job.result });
    });
    it('should create and delete job', async () => {
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
    it('should getPipelinesStats', async () => {
        const experimentName = 'aggregate';
        const job1 = generateJob(null, 'simple1', 'failed', experimentName);
        const job2 = generateJob(null, 'simple1', 'stopped', experimentName);
        const job3 = generateJob(null, 'simple1', 'completed', experimentName);
        const job4 = generateJob(null, 'simple1', 'active', experimentName);
        const job5 = generateJob(null, 'simple2', 'failed', experimentName);
        const job6 = generateJob(null, 'simple2', 'failed', experimentName);
        const job7 = generateJob(null, 'simple3', 'active', experimentName);
        const job8 = generateJob(null, 'simple3', 'active', experimentName);
        const job9 = generateJob(null, 'simple4', 'active', experimentName);
        await db.jobs.create(job1);
        await db.jobs.create(job2);
        await db.jobs.create(job3);
        await db.jobs.create(job4);
        await db.jobs.create(job5);
        await db.jobs.create(job6);
        await db.jobs.create(job7);
        await db.jobs.create(job8);
        await db.jobs.create(job9);
        const limit = 3;
        const response = await db.jobs.getPipelinesStats({
            pipelineType: 'stored',
            experimentName,
            limit,
        });
        expect(response).to.have.lengthOf(limit);
        const pipeline = response.find(r => r.name === 'simple1');
        const stats = pipeline.stats.map(s => s.status).sort();
        expect(stats).to.eql(['active', 'completed', 'failed', 'stopped']);
    });
    it('should search running job by multi params', async () => {
        const job = generateJob();
        const { result, ...jobData } = job;
        const { experimentName, name: pipelineName } = jobData.pipeline;
        const pipelineType = jobData.pipeline.types[1];
        const algorithmName = jobData.pipeline.nodes[1].algorithmName;
        await db.jobs.create(jobData);
        const response = await db.jobs.search({
            experimentName,
            pipelineName,
            pipelineType,
            algorithmName,
            hasResult: false,
        });
        expect(response).to.have.lengthOf(1);
        expect(response[0]).to.eql(jobData);
    });
    it('should search not running job by multi params', async () => {
        const jobData = generateJob();
        const { experimentName, name: pipelineName } = jobData.pipeline;
        const pipelineType = jobData.pipeline.types[1];
        const algorithmName = jobData.pipeline.nodes[1].algorithmName;
        await db.jobs.create(jobData);
        const response = await db.jobs.search({
            experimentName,
            pipelineName,
            pipelineType,
            algorithmName,
            hasResult: true,
        });
        expect(response).to.have.lengthOf(1);
        expect(response[0]).to.eql(jobData);
    });
    it('should create and update result', async () => {
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
        const jobData = generateJob();
        const { status, ...job } = jobData;
        const { jobId } = job;
        const level = 'info';
        await db.jobs.create(job);
        await db.jobs.updateStatus({ jobId, level });
        const res = await db.jobs.fetch({ jobId });
        expect(res.status.level).to.eql(level);
    });
    it('should create and update pipeline', async () => {
        const job = generateJob();
        const { jobId } = job;
        const types = ['foo', 'bar'];
        await db.jobs.create(job);
        await db.jobs.updatePipeline({ jobId, types });
        const res = await db.jobs.fetchPipeline({ jobId });
        expect(res.types).to.eql(types);
    });
    it('should create and fetch job list', async () => {
        const job1 = generateJob();
        const job2 = generateJob();
        const job3 = generateJob();
        await db.jobs.create(job1);
        await db.jobs.create(job2);
        await db.jobs.create(job3);
        const list = await db.jobs.fetchAll();
        expect(list.length).to.be.greaterThan(3);
    });
    it('should fetch active and inactive datasources', async () => {
        // this test scans through the whole collection and requires an empty collection
        await db.jobs.collection.deleteMany({});
        const statuses = Object.values(pipelineStatuses);
        const jobs = new Array(statuses.length)
            .fill(0)
            .map(generateDataSourceJob);
        await Promise.all(jobs.map(job => db.jobs.create(job)));
        await Promise.all(
            jobs.map((job, ii) =>
                db.jobs.updateStatus({
                    jobId: job.jobId,
                    status: statuses[ii],
                })
            )
        );

        const activeJobs = await db.jobs.scanMountedDataSources({
            returnActiveJobs: true,
        });
        const inactiveJobs = await db.jobs.scanMountedDataSources({
            returnActiveJobs: false,
        });
        expect(inactiveJobs.length).to.eq(doneStatus.length);
        expect(activeJobs.length).to.eq(statuses.length - doneStatus.length);
    });
    it('should avoid fetching dataSources for jobs not old enough', async () => {
        const sleepDuration = 100;
        await db.jobs.collection.deleteMany({});
        // an extra active job
        await db.jobs.create(generateDataSourceJob());

        const firstJob = generateDataSourceJob();
        await db.jobs.create(firstJob);
        await db.jobs.updateStatus({
            jobId: firstJob.jobId,
            status: pipelineStatuses.COMPLETED,
        });
        await sleep(sleepDuration);

        const secondJob = generateDataSourceJob();
        await db.jobs.create(secondJob);
        await db.jobs.updateStatus({
            jobId: secondJob.jobId,
            status: pipelineStatuses.COMPLETED,
        });

        const activeJobs = await db.jobs.scanMountedDataSources({
            returnActiveJobs: true,
        });
        expect(activeJobs).to.have.lengthOf(1);
        const recentInactiveJobs = await db.jobs.scanMountedDataSources({
            returnActiveJobs: false,
            inactiveTime: sleepDuration / 2,
        });
        expect(recentInactiveJobs).to.have.lengthOf(1);
        const oldInactiveJobs = await db.jobs.scanMountedDataSources({
            returnActiveJobs: false,
            inactiveTime: sleepDuration * 2,
        });
        expect(oldInactiveJobs).to.have.lengthOf(2);
    });
});
