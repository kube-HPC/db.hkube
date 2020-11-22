const Collection = require('./Collection');

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

    async fetch({ jobId }) {
        const entry = await super.fetch({ jobId }, { _id: 0 });
        return entry;
    }

    async update(job) {
        const { jobId, graph, pipeline, status, result } = job;
        await super.updateOne(
            { jobId },
            { $set: { graph, pipeline, status, result } }
        );
        return jobId;
    }

    async delete(job) {
        const result = await super.delete(job);
        return result;
    }

    async fetchAll(options) {
        return super.fetchAll(options, { _id: 0 });
    }
}

module.exports = Jobs;
