const Collection = require('./Collection');
const { stripId } = require('./Collection');

class Jobs extends Collection {
    async init() {
        await super.createUniqueIndex();
    }

    /**
     * @param {object} props
     * @param {string} props.jobId
     * @param {string} props.pipeline
     * @param {string} props.graph
     * @param {string} props.status
     * @param {string} props.result
     * @returns {Promise<DataSource>}
     */
    async create(job) {
        return super.create(job);
    }

    async update(job) {
        const { jobId, graph, pipeline, status, result } = job;
        await this.collection.updateOne(
            { jobId },
            { $set: { graph, pipeline, status, result } },
            { upsert: true }
        );
        return jobId;
    }

    async fetch({ jobId }) {
        const entry = await super.fetch({ jobId });
        const { id, ...data } = entry;
        return data;
    }

    async fetchAll() {
        return this.collection
            .find({})
            .map(entry => super[stripId](entry))
            .toArray();
    }
}

module.exports = Jobs;
