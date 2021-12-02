const { expect } = require('chai');
const uuid = require('uuid').v4;
const {
    generateTask,
} = require('./common');

let db = null;
describe('Tasks', () => {
    before(async () => {
        db = global.testParams.db;
    });
    it('should not throw error itemNotFound', async () => {
        const task = generateTask();
        const response = await db.tasks.fetch({ taskId: task.taskId });
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const task = generateTask();
        await db.tasks.create(task);
        const promise = db.tasks.create(task);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch task', async () => {
        const task = generateTask();
        const res1 = await db.tasks.create(task);
        const res2 = await db.tasks.fetch({ taskId: task.taskId });
        expect(res1).to.eql(res2);
    });
    it('should create and update task', async () => {
        const task = generateTask();
        await db.tasks.create(task);
        await db.tasks.update({ taskId: task.taskId, status: 'success' });
        const res = await db.tasks.fetch({ taskId: task.taskId });
        expect(res).to.eql(res2);
    });
    it('should create many', async () => {
        const taskCount = 5000;
        const tasks = Array.from(Array(taskCount).keys()).map(generateTask);
        console.time('createMany')
        const res1 = await db.tasks.createMany(tasks);
        console.timeEnd('createMany')
        // const res2 = await db.tasks.fetchAll({ query: { cpu } });
        // expect(res1.inserted).to.eql(res2.length);
    });
    it.only('should update many', async () => {
        const taskCount = 5000;
        const jobId = uuid();
        const nodeName = uuid();
        const tasks = Array.from(Array(taskCount).keys()).map(t => generateTask({ jobId, nodeName }));
        const res2 = await db.tasks.updateTasksStatus({ jobId, nodeName, status: 'completed' });
        const res3 = await db.tasks.search({ jobId });
        expect(res1.inserted).to.eql(res2.length);
    });
    it('should throw on create many', async () => {
        const taskId1 = uuid();
        const taskId2 = uuid();
        const task1 = generateTask({ taskId: taskId1 });
        const task2 = generateTask({ taskId: taskId2 });
        const task3 = generateTask({ taskId: taskId1 });
        const task4 = generateTask({ taskId: taskId2 });
        await db.tasks.createMany([task1, task2]);
        const promise = db.tasks.createMany([task3, task4], {
            throwOnConflict: true,
        });
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should throw on delete many', async () => {
        const promise = db.tasks.deleteMany({ jobId: 'bla' });
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should update many', async () => {
        const cpu1 = Math.random() * 1000;
        const cpu2 = Math.random() * 1000;
        const task1 = generateTask({ jobId: cpu1 });
        const task2 = generateTask({ jobId: cpu1 });
        await db.tasks.createMany([task1, task2]);
        const res = await db.tasks.updateMany({
            filter: { cpu: cpu1 },
            query: { $set: { cpu: cpu2 } },
        });
        const res2 = await db.tasks.fetchAll({ query: { cpu: cpu2 } });
        expect(res.modified).to.eql(res2.length);
    });
    it('should create and update task', async () => {
        const task = generateTask();
        const status = 'completed';
        const taskId = task.taskId;
        await db.tasks.create(task);
        await db.tasks.update({ taskId, data: { status } });
        const res = await db.tasks.fetch({ taskId });
        expect(res).to.eql({ ...task, status });
    });
    it('should create and patch task', async () => {
        const task = generateTask();
        const status = 'completed';
        const taskId = task.taskId;
        await db.tasks.create(task);
        await db.tasks.patch({ taskId, data: { status } });
        const res = await db.tasks.fetch({ taskId });
        expect(res).to.eql({ ...task, status });
    });
    it('should create and patch nested prop', async () => {
        const task = generateTask();
        const taskId = task.taskId;
        await db.tasks.create(task);
        await db.tasks.patch({ taskId, data: { output: { path: 'bla' } } });
        const res = await db.tasks.fetch({ taskId });
        expect(res.output.path).to.eql('bla');
    });
    it('should create and fetch task list by query', async () => {
        const jobId = uuid();
        const task1 = generateTask({ batchIndex: 7, jobId });
        const task2 = generateTask({ batchIndex: 5, jobId });
        const task3 = generateTask({ batchIndex: 9, jobId });
        const task4 = generateTask({ batchIndex: 8, jobId });
        await db.tasks.create(task1);
        await db.tasks.create(task2);
        await db.tasks.create(task3);
        await db.tasks.create(task4);
        const list = await db.tasks.fetchAll({
            query: { jobId },
            sort: { batchIndex: 'desc' },
            limit: 3,
        });
        expect(list).to.have.lengthOf(3);
        expect(list[0].batchIndex).to.eql(9);
    });
    it('should create and fetch task count', async () => {
        const jobId = uuid();
        const task1 = generateTask({ jobId });
        const task2 = generateTask({ jobId });
        const task3 = generateTask({ jobId });
        const task4 = generateTask({ jobId });
        await db.tasks.create(task1);
        await db.tasks.create(task2);
        await db.tasks.create(task3);
        await db.tasks.create(task4);
        const list = await db.tasks.count({ query: { jobId } });
        expect(list).to.eql(4);
    });
    it.skip('should watch on task create', async () => {
        let resolve;
        const promise = new Promise((res) => { resolve = res; });

        const task = generateTask();

        await db.tasks.watch({ jobId: task.jobId }, (doc) => {
            resolve();
        });
        await db.tasks.create(task);
        await promise;
    });
    it('should watch on task update', async () => {
        let resolve;
        const promise = new Promise((res) => { resolve = res; });

        const task = generateTask();
        const { jobId, taskId } = task;
        const status1 = 'active';
        const status2 = 'completed';
        let count = 0;

        await db.tasks.watch({ jobId }, (doc) => {
            count++;
            if (count === 2) {
                resolve();
            }
        });
        await db.tasks.create(task);
        db.tasks.update({ jobId, taskId, status: status1 });
        db.tasks.update({ jobId, taskId, status: status2 });
        await promise;
    });
    it('should watch on multiple tasks', async () => {
        let resolve;
        let count = 0;
        const promise = new Promise((res) => { resolve = res; });
        const jobId = uuid();
        const task1 = generateTask({ jobId });
        const task2 = generateTask({ jobId });
        const task3 = generateTask({ jobId });

        await db.tasks.watch({ jobId }, (doc) => {
            count++;
            if (count === 3) {
                resolve();
            }
        });
        await db.tasks.create(task1);
        await db.tasks.create(task2);
        await db.tasks.create(task3);
        await promise;
    });
});
