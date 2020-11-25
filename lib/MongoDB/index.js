const { MongoClient } = require('mongodb');
const DataSources = require('./DataSources');
const Pipelines = require('./Pipelines');
const Algorithms = require('./algorithms/store');
const Jobs = require('./Jobs');
const Experiments = require('./Experiments');

/** @typedef {import('./../types').MongoConfig} MongoConfig */
/** @typedef {import('../Provider').ProviderInterface} ProviderInterface */

/** @implements {ProviderInterface} */
class MongoDB {
    /** @param {MongoConfig} config */
    constructor(config) {
        const { host, port, dbName, ...rest } = config;
        if (config.auth && (!config.auth.user || !config.auth.password)) {
            throw new Error(
                `mongodb - partial auth parameters, you did not provide ${
                    config.auth.user ? 'password' : 'user'
                }`
            );
        }
        const connectionString = `mongodb://${host}:${port}/`;
        this.dbName = dbName;
        this.client = new MongoClient(connectionString, rest);
    }

    async init() {
        // handle fail case
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.dataSources = new DataSources(this.db, this.client);
        this.pipelines = new Pipelines(this.db, this.client);
        this.algorithms = new Algorithms(this.db, this.client);
        this.jobs = new Jobs(this.db, this.client);
        this.experiments = new Experiments(this.db, this.client);
        await this.pipelines.init();
        await this.algorithms.init();
        await this.jobs.init();
        await this.experiments.init();
    }

    get isConnected() {
        return this.client.isConnected();
    }

    async close(force = false) {
        return this.client.close(force);
    }
}

module.exports = MongoDB;
