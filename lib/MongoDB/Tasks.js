const Collection = require('./Collection');
const collections = require('./collections');
const Query = require('./Query');

class Tasks extends Collection {
    constructor(db, client) {
        super(db, client, collections.Tasks);
    }

    async init() {
        await super.init();
    }

    async create(task) {
        return super.create(task);
    }

    async createMany(tasks) {
        return super.createMany(tasks);
    }

    async updateTasksStatus({ jobId, nodeName, tasksIds, status }) {
        return super.updateMany({
            filter: { jobId, nodeName, taskId: { $in: tasksIds } },
            query: { $set: { status } },
            upsert: true,
        });
    }

    async updateTaskStatus(task) {
        const { taskId, status } = task;
        const result = await super.updateOne({
            filter: { taskId },
            query: { $set: { status } },
            upsert: false,
        });
        return result;
    }

    async fetch({ taskId }) {
        const entry = await super.fetch({ taskId }, { excludeId: true });
        return entry;
    }

    async fetchMany({ tasks }) {
        const entry = await super.fetchMany({ tasks }, { excludeId: true });
        return entry;
    }

    async search({
        jobId,
        taskId,
        algorithmName,
        status,
        fields = {},
        sort = null,
        limit = 0,
    } = {}) {
        const query = new Query()
            .addParam('jobId', jobId)
            .addParam('taskId', taskId)
            .addParam('algorithmName', algorithmName)
            .addParam('status', status)
            .create();

        const list = await super.fetchAll({
            query,
            fields,
            sort,
            limit,
            excludeId: true,
        });
        return list;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({
            query,
            fields,
            sort,
            limit,
            excludeId: true,
        });
        return list;
    }

    async update(task) {
        const { taskId } = task;
        const result = await super.updateOne({
            filter: { taskId },
            query: { $set: task },
            upsert: true,
        });
        return result;
    }

    async replace(task) {
        const { taskId } = task;
        const result = await super.replaceOne({
            filter: { taskId },
            replacement: task,
            upsert: true,
        });
        return result;
    }

    async patch(task) {
        const { taskId } = task;
        const result = await super.patch({
            query: { taskId },
            data: task,
        });
        return result;
    }

    async watch({ jobId }, cb) {
        const pipeline = [{
            $match: {
                $or: [
                    {
                        operationType: 'insert',
                    },
                    {
                        operationType: 'update',
                    }],
                'fullDocument.jobId': jobId
            }
        }];
        const watchCursor = await super.watch(pipeline, (doc) => {
            const { _id, ...rest } = doc.fullDocument;
            const updatedFields = doc.updateDescription?.updatedFields;
            const task = { ...rest, ...updatedFields };
            cb(task);
        });
        this._watchMap.set(jobId, watchCursor);
    }

    async unwatch({ jobId }) {
        const watchCursor = this._watchMap.get(jobId);
        if (watchCursor) {
            await watchCursor.close();
        }
    }
}

module.exports = Tasks;
