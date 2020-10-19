const { MongoClient } = require('mongodb');
const DataSources = require('./DataSources');
const Pipelines = require('./Pipelines');
const Algorithms = require('./Algorithms');

class DB {
    constructor(config) {
        this.client = new MongoClient(config);
        this.dataSources = null;
        this.pipelines = null;
        this.algorithms = null;
    }

    async init() {
        // handle fail case
        await this.client.connect();
        this.db = this.client.db();
        this.dataSources = new DataSources(this.db.collection('dataSources'));
        this.pipelines = new Pipelines(this.db.collection('pipeLines'));
        this.algorithms = new Algorithms(this.db.collection('algorithms'));
    }

    get isConnected() {
        return this.client.isConnected;
    }

    async close(force = false) {
        return this.client.close(force);
    }
}

module.exports = DB;
