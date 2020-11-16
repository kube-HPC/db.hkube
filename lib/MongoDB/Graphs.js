const { itemNotFound, conflict } = require('../errors');
const Collection = require('./Collection');
const { stripId } = require('./Collection');

const INDEX = 'jobId';

class Graph extends Collection {
    async init() {
        const isExists = await this.collection.indexExists(INDEX);
        if (!isExists) {
            await this.collection.createIndex({ jobId: 1 }, { name: INDEX, unique: true });
        }
    }

    /**
     * @param {object} props
     * @param {string} props.jobId
     * @param {string} props.timestamp
     * @param {string} props.nodes
     * @param {string} props.edges
     * @returns {Promise<DataSource>}
     */
    async create(graph) {
        // not using the super.create....
        try {
            await this.collection.insertOne({ ...graph });
            return graph;
        } catch (error) {
            if (error.code === 11000) {
                throw conflict('graph', INDEX);
            }
            throw error;
        }
    }

    async update(graph) {
        await this.collection.updateOne(
            { jobId: graph.jobId },
            {
                $set: { nodes: graph.nodes, edges: graph.edges, timestamp: graph.timestamp }
            });
        return graph;
    }

    async fetch({ jobId }) {
        // not using the super.create....
        const entry = await this.collection.findOne({ jobId });
        if (!entry) {
            throw itemNotFound(this.collectionName, jobId);
        }
        const { _id, ...graph } = entry;
        return graph;
    }

    async fetchAll() {
        return this.collection
            .find({})
            .map(entry => super[stripId](entry))
            .toArray();
    }
}

module.exports = Graph;
