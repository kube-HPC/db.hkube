const { pipelineStatuses } = require('@hkube/consts');
const { expect } = require('chai');
const { promisify } = require('util');
const cloneDeep = require('lodash.clonedeep');
const { v4: uuid } = require('uuid');
const { doneStatus } = require('./../lib/MongoDB/Jobs');
const { generateJob, generateDataSourceJob, generateGraph } = require('./common');
let db = null;
const sleep = promisify(setTimeout);

describe('Jobs', () => {
    before(async () => {
        db = global.testParams.db;
    });
    describe('Crud', () => {
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
        it('should create and fetch graph', async () => {
            const job = generateJob();
            const { jobId } = job;
            await db.jobs.create(job);
            const res = await db.jobs.fetchGraph({ jobId });
            expect(res).to.eql({ jobId, ...job.graph });
        });
        it('should ignore undefined graph', async () => {
            const job = generateJob();
            job.graph.nodes[0].output = undefined;
            const { jobId } = job;
            await db.jobs.create(job);
            const res = await db.jobs.fetchGraph({ jobId });
            expect(res.nodes[0]).to.not.have.property('output');
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
        it('should get pipelines and truncate large objects', async () => {
            const experimentName = uuid();
            const jobsToCreate = [
                generateJob({ pipeline: 'simple2', status: 'failed', experimentName }),
                generateJob({ pipeline: 'simple2', status: 'failed', experimentName }),
            ]
            jobsToCreate.forEach((j, i) => {
                j.pipeline.startTime = Date.now() + i * 1000
                j.pipeline.flowInput = { large: 'd'.repeat((i + 1) * 1000) }
                j.pipeline.flowInput2 = { large: 'd'.repeat((i + 1) * 1000) }
                j.pipeline.flowInput3 = { large: 'd'.repeat((i + 1) * 1000) }
                j.status.largeObject = { large: 'd'.repeat((i + 1) * 1000) }
            })
            for (const j of jobsToCreate) {
                await db.jobs.create(j);
            }
            const pipelines = await db.jobs.getPipelines({
                experimentName,
                limit: 10,
                itemsToRemove: ['pipeline.flowInput', 'pipeline.flowInput3', 'status.largeObject'],
                maxItemsSize: 1100
            })
            expect(pipelines[1].pipeline.flowInput.large).to.have.lengthOf(1000)
            expect(pipelines[1].pipeline.flowInput2.large).to.have.lengthOf(1000)
            expect(pipelines[0].pipeline.flowInput.truncated).to.eql('Size of object (2017) is larger than 1100')
            expect(pipelines[0].pipeline.flowInput3.truncated).to.eql('Size of object (2017) is larger than 1100')
            expect(pipelines[0].status.largeObject.truncated).to.eql('Size of object (2017) is larger than 1100')
            expect(pipelines[0].pipeline.flowInput2.large).to.have.lengthOf(2000)
        })
        it('should get pipelines and not truncate large objects', async () => {
            const experimentName = uuid();
            const jobsToCreate = [
                generateJob({ pipeline: 'simple2', status: 'failed', experimentName }),
                generateJob({ pipeline: 'simple2', status: 'failed', experimentName }),
            ]
            jobsToCreate.forEach((j, i) => {
                j.pipeline.startTime = Date.now() + i * 1000
                j.pipeline.flowInput = { large: 'd'.repeat((i + 1) * 1000) }
                j.pipeline.flowInput2 = { large: 'd'.repeat((i + 1) * 1000) }
                j.pipeline.flowInput3 = { large: 'd'.repeat((i + 1) * 1000) }
                j.status.largeObject = { large: 'd'.repeat((i + 1) * 1000) }
            })
            for (const j of jobsToCreate) {
                await db.jobs.create(j);
            }
            const pipelines = await db.jobs.getPipelines({
                experimentName,
                limit: 10
            })
            expect(pipelines[1].pipeline.flowInput.large).to.have.lengthOf(1000)
            expect(pipelines[1].pipeline.flowInput2.large).to.have.lengthOf(1000)
            expect(pipelines[0].pipeline.flowInput.large).to.have.lengthOf(2000)
            expect(pipelines[0].pipeline.flowInput3.large).to.have.lengthOf(2000)
            expect(pipelines[0].status.largeObject.large).to.have.lengthOf(2000)
            expect(pipelines[0].pipeline.flowInput2.large).to.have.lengthOf(2000)
        })
        it('should getPipelinesStats', async () => {
            const experimentName = 'aggregate';
            const jobsToCreate = [
                generateJob({ pipeline: 'simple2', status: 'failed', experimentName }),
                generateJob({ pipeline: 'simple2', status: 'failed', experimentName }),
                generateJob({ pipeline: 'simple3', status: 'active', experimentName }),
                generateJob({ pipeline: 'simple3', status: 'active', experimentName }),
                generateJob({ pipeline: 'simple4', status: 'active', experimentName }),
                generateJob({ pipeline: 'simple1', status: 'failed', experimentName }),
                generateJob({ pipeline: 'simple1', status: 'stopped', experimentName }),
                generateJob({ pipeline: 'simple1', status: 'completed', experimentName }),
                generateJob({ pipeline: 'simple1', status: 'active', experimentName }),
            ]
            jobsToCreate.forEach((j, i) => j.pipeline.startTime = Date.now() + i * 1000)
            for (const j of jobsToCreate) {
                await db.jobs.create(j);
            }
            const limit = 5;
            const response = await db.jobs.getPipelinesStats({
                pipelineType: 'stored',
                experimentName,
                limit,
            });
            const totalResults = response.reduce((s1, r) => s1 + r.stats.reduce(((s2, s) => s2 + s.count), 0), 0)
            expect(totalResults).to.eql(limit);
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
        it('should search running job by concurrency', async () => {
            const job = generateJob();
            const { result, ...jobData } = job;
            await db.jobs.create(jobData);
            const response = await db.jobs.search({
                pipelineType: 'stored',
                isConcurrencyReject: false,
                hasResult: false,
                fields: {
                    name: 'pipeline.name',
                    amount: 'pipeline.options.concurrentPipelines.amount',
                }
            });
            expect(response[0]).to.have.property('name');
            expect(response[0]).to.have.property('amount');
        });
        it('should search jobs with non existing', async () => {
            const job = generateJob();
            const { experimentName, name: pipelineName } = job.pipeline;
            const pipelineType = job.pipeline.types[1];
            const algorithmName = job.pipeline.nodes[1].algorithmName;
            job.userPipeline = job.pipeline;
            for (const i of [...(new Array(5))]) {
                const jobData = { ...job, jobId: uuid() }
                await db.jobs.create(jobData);
            }
            const jobDataMissing = { ...job, jobId: uuid() }
            delete jobDataMissing.userPipeline;
            await db.jobs.create(jobDataMissing);
            const response = await db.jobs.search({
                experimentName,
                pipelineName,
                pipelineType,
                algorithmName,
                exists: {
                    userPipeline: false
                }
            });
            expect(response).to.have.lengthOf(1);
            expect(response[0]).to.eql(jobDataMissing);
        });
        it('should search jobs with existing', async () => {
            const job = generateJob();
            const { experimentName, name: pipelineName } = job.pipeline;
            const pipelineType = job.pipeline.types[1];
            const algorithmName = job.pipeline.nodes[1].algorithmName;
            job.userPipeline = job.pipeline;
            for (const i of [...(new Array(5))]) {
                const jobData = { ...job, jobId: uuid() }
                await db.jobs.create(jobData);
            }
            const jobDataMissing = { ...job, jobId: uuid() }
            delete jobDataMissing.userPipeline;
            await db.jobs.create(jobDataMissing);
            const response = await db.jobs.search({
                experimentName,
                pipelineName,
                pipelineType,
                algorithmName,
                exists: {
                    userPipeline: true
                }
            });
            expect(response).to.have.lengthOf(5);
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
        it('should create and update graph', async () => {
            const job = generateJob();
            const { jobId } = job;
            const graph2 = generateGraph();
            await db.jobs.create(job);
            await db.jobs.updateGraph({ jobId, graph: graph2 });
            const res = await db.jobs.fetch({ jobId });
            expect(res.graph).to.eql(graph2);
            expect(res.timestamp).to.not.exist
        });
        it('should create and update empty graph', async () => {
            const job = generateJob();
            const { jobId } = job;
            const graph2 = { options: {}, nodes: [], edges: [], jobId, timestamp: Date.now() };
            await db.jobs.create(job);
            await db.jobs.updateGraph({ jobId, graph: graph2 });
            const res = await db.jobs.fetch({ jobId });
            expect(res.graph).to.eql(graph2);
            expect(res.timestamp).to.not.exist
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
    describe('Watch', () => {
        it('should watch on job status', async () => {
            let resolveStatus;
            const promiseStatus = new Promise((res) => { resolveStatus = res; });

            const job = generateJob();
            await db.jobs.create(job);
            const { jobId } = job;

            await db.jobs.watchStatus({}, (job) => {
                resolveStatus(job);
            });

            await db.jobs.updateStatus({ jobId, status: 'completed' });
            const status = await promiseStatus;
            expect(status.status).to.eql('completed');
        });
        it('should watch on job result', async () => {
            let resolveResult;
            const promiseResult = new Promise((res) => { resolveResult = res; });

            const job = generateJob();
            await db.jobs.create(job);
            const { jobId } = job;

            await db.jobs.watchResult({ jobId }, (job) => {
                resolveResult(job);
            });

            await db.jobs.updateResult({ jobId, data: { res: 42 } });
            const result = await promiseResult;
            expect(result.data.res).to.eql(42);
        });
    });
    describe('Pagination', () => {
        before(async () => {
            const numOfJobs = 200;
            const startTime = new Date('2021-03-11T14:30:00').getTime();
            const jobs = Array.from(Array(numOfJobs).keys()).map(k => {
                const number = k + 1;
                return generateJob({
                    number,
                    pipelineType: ['pagination'],
                    startTime: startTime + number * 60000
                });
            });
            await Promise.all(jobs.map(j => db.jobs.create(j)));
        })
        it('should throw invalid cursor', async () => {
            const promise = db.jobs.searchApi({
                cursor: 'invalid_cursor'
            });
            await expect(promise).to.be.rejectedWith(/please provide a valid cursor/i);
        });
        it('should search with dates range of one hour', async () => {
            const hour = 60;
            const res = await db.jobs.searchApi({
                query: {
                    datesRange: {
                        from: '2021-03-11T14:30:00',
                        to: '2021-03-11T15:31:00'
                    },
                    pipelineType: 'pagination'
                },
                sort: 'asc',
                fields: {
                    jobId: true,
                    number: true,
                    pipeline: true
                }
            });
            expect(res.hits).to.have.lengthOf(hour);
            expect(res.hits[0].number).to.eql(1);
            expect(res.hits[res.hits.length - 1].number).to.eql(hour);
        });
        it('should search with page number', async () => {
            const limit = 10;
            const request = {
                limit,
                query: {
                    pipelineType: 'pagination'
                },
                sort: 'asc',
                fields: {
                    jobId: true,
                    number: true,
                    pipeline: true
                },
                exists: {
                    jobId: true
                }
            }
            const res1 = await db.jobs.searchApi({
                pageNum: 1,
                ...request,

            });
            const res2 = await db.jobs.searchApi({
                pageNum: 2,
                ...request,
            });
            expect(res1.hits).to.have.lengthOf(limit);
            expect(res1.hits[0].number).to.eql(1);
            expect(res1.hits[limit - 1].number).to.eql(limit);
            expect(res2.hits).to.have.lengthOf(limit);
            expect(res2.hits[0].number).to.eql(limit + 1);
            expect(res2.hits[limit - 1].number).to.eql(limit * 2);
        });
        it('should search with cursor asc sort', async () => {
            const limit = 10;
            const request = {
                limit,
                query: {
                    pipelineType: 'pagination'
                },
                sort: 'asc',
                fields: {
                    jobId: true,
                    number: true,
                    pipeline: true
                }
            }
            const res1 = await db.jobs.searchApi({
                ...request,
            });
            const res2 = await db.jobs.searchApi({
                cursor: res1.cursor,
                ...request,
            });
            expect(res1.hits).to.have.lengthOf(limit);
            expect(res1.hits[0].number).to.eql(1);
            expect(res1.hits[limit - 1].number).to.eql(limit);
            expect(res2.hits).to.have.lengthOf(limit);
            expect(res2.hits[0].number).to.eql(limit + 1);
            expect(res2.hits[limit - 1].number).to.eql(limit * 2);
        });
        it('should search with cursor desc sort', async () => {
            const limit = 10;
            const request = {
                limit,
                query: {
                    pipelineType: 'pagination'
                },
                sort: 'desc',
                fields: {
                    jobId: true,
                    number: true,
                    pipeline: true
                }
            }
            const res1 = await db.jobs.searchApi({
                ...request,
            });
            const res2 = await db.jobs.searchApi({
                cursor: res1.cursor,
                ...request,
            });
            expect(res1.hits).to.have.lengthOf(limit);
            expect(res1.hits[0].number).to.eql(200);
            expect(res1.hits[limit - 1].number).to.eql(191);
            expect(res2.hits).to.have.lengthOf(limit);
            expect(res2.hits[0].number).to.eql(190);
            expect(res2.hits[limit - 1].number).to.eql(181);
        });
    });
    describe('handle large collection', () => {
        before(async () => {
            await db.jobs.delete({ tooLarge: true });
        })
        afterEach(async () => {
            await db.jobs.delete({ tooLarge: true });
        })
        it('should search with large collection', async () => {
            const pipe = {
                jobId: 'large-jobid',
                pipeline: {
                    experimentName: 'main',
                    flowInput: {
                        large: 'd'.repeat(1500000)
                    },
                    startTime: Date.now()
                },
                tooLarge: true
            }
            for (let i = 0; i < 100; i++) {
                const largeJob = cloneDeep(pipe);
                largeJob.jobId = `${largeJob.jobId}-${i}`
                largeJob.pipeline.startTime = largeJob.pipeline.startTime + i * 100;
                await db.jobs.create(largeJob);
            }
            const response = await db.jobs.search({
                experimentName: 'main',
                sort: 'desc',
                limit: 100,
                fields: {
                    key: 'jobId',
                    jobId: true,
                    pipeline: true,
                }
            });
            expect(response).to.have.lengthOf(100);
            const getOne = await db.jobs.fetch({ jobId: `${pipe.jobId}-${20}` })
            expect(getOne.jobId).to.eql(`${pipe.jobId}-${20}`)
        });
    });
});
