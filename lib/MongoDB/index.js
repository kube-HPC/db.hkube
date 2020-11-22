const { MongoClient } = require('mongodb');
const DataSources = require('./DataSources');
const Pipelines = require('./Pipelines');
const Algorithms = require('./algorithms/store');
const Versions = require('./algorithms/versions');
const Builds = require('./algorithms/builds');
const Jobs = require('./Jobs');
const collections = require('../const/collections');

/** @typedef {import('./../types').MongoConfig} MongoConfig */
/** @typedef {import('../Provider').ProviderInterface} ProviderInterface */

/** @implements {ProviderInterface} */
class MongoDB {
    /** @param {MongoConfig} config */
    constructor(config) {
        const { host, port, dbName, ...rest } = config;
        let auth;
        if (config.auth.user || config.auth.password) {
            auth = config.auth;
        }
        if (auth && (!auth.user || !auth.password)) {
            throw new Error(
                `mongodb - partial auth parameters, you did not provide ${
                    auth.user ? 'password' : 'user'
                }`
            );
        }
        const connectionString = `mongodb://${host}:${port}/`;
        this.dbName = dbName;
        this.client = new MongoClient(connectionString, { ...rest, auth });
        this.dataSources = null;
        this.pipelines = null;
        this.algorithms = null;
    }

    async init() {
        // handle fail case
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.dataSources = new DataSources(
            this.db,
            this.client,
            collections.DataSources
        );
        this.pipelines = new Pipelines(
            this.db,
            this.client,
            collections.Pipelines
        );
        this.algorithms = new Algorithms(
            this.db,
            this.client,
            collections.Algorithms
        );
        this.algorithms.versions = new Versions(
            this.db,
            this.client,
            collections.Algorithms
        );
        this.algorithms.builds = new Builds(
            this.db,
            this.client,
            collections.Algorithms
        );
        this.jobs = new Jobs(this.db, this.client, collections.Jobs);
        await this.pipelines.init();
        await this.algorithms.init();
        await this.jobs.init();
    }

    get isConnected() {
        return this.client.isConnected();
    }

    async close(force = false) {
        return this.client.close(force);
    }
}

module.exports = MongoDB;
