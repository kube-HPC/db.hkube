const { MongoClient } = require('mongodb');
const DataSources = require('./DataSources');
const Pipelines = require('./Pipelines');
const Algorithms = require('./Algorithms');
/** @typedef {import('./../types').MongoConfig} MongoConfig */
/** @typedef {import('../Provider').ProviderInterface} ProviderInterface */

/** @implements {ProviderInterface} */
class MongoDB {
    /** @param {MongoConfig} config */
    constructor(config) {
        const { host, port, dbName, ...rest } = config;
        const connectionString = `mongodb://${host}:${port}/`;
        this.dbName = dbName;
        this.client = new MongoClient(connectionString, rest);
        this.dataSources = null;
        this.pipelines = null;
        this.algorithms = null;
    }

    async init() {
        // handle fail case
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.dataSources = new DataSources(this.db.collection('dataSources'));
        this.pipelines = new Pipelines(this.db.collection('pipeLines'));
        this.algorithms = new Algorithms(this.db.collection('algorithms'));
    }

    get isConnected() {
        return this.client.isConnected();
    }

    async close(force = false) {
        return this.client.close(force);
    }
}

module.exports = MongoDB;
