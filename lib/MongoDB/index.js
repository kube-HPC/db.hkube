const { MongoClient, MongoError } = require('mongodb');
const DataSources = require('./DataSources');
const Pipelines = require('./pipelines/store');
const Algorithms = require('./algorithms/store');
const Jobs = require('./Jobs');
const Tasks = require('./Tasks');
const Experiments = require('./Experiments');
const Gateways = require('./Gateways');
const TensorBoards = require('./TensorBoards');
const Devenvs = require('./Devenvs');
const OptunaBoards = require('./OptunaBoards');
const TriggersTree = require('./TriggersTree');
const WebhookStatus = require('./webhooks/status');
const WebhookResult = require('./webhooks/result');
const PipelineDrivers = require('./PipelineDrivers');
const Snapshots = require('./Snapshots');

class MongoDB {
    constructor(config) {
        const { host, port, dbName, replicaSet, connectionMethod, tls, ...rest } = config;
        this.config = { host, port, dbName };
        let auth;
        if (config.auth?.user && config.auth?.password) {
            auth = config.auth;
        }
        const options = {
            useUnifiedTopology: true,
            ignoreUndefined: true,
            retryWrites: false, // for now, the transactions aren't working for standalone mongo
        };
        let connectionString;
        switch (connectionMethod) {
            case 'mongodb+srv':
                connectionString = `${connectionMethod}://${host}?tls=${tls}&ssl=${tls}`;
                break;
            case 'mongodb':
            default:
                connectionString = `mongodb://${host}:${port}/`;
                break;
        }
        this.dbName = dbName;
        this.client = new MongoClient(connectionString, {
            ...rest,
            ...options,
            auth,
        });
    }

    async init({ createIndices = false } = {}) {
        // handle fail case
        await this.client.connect();
        this._isConnected = true;
        this.db = this.client.db(this.dbName);
        this.dataSources = new DataSources(this.db, this.client);
        this.snapshots = new Snapshots(this.db, this.client);
        this.pipelines = new Pipelines(this.db, this.client);
        this.algorithms = new Algorithms(this.db, this.client);
        this.jobs = new Jobs(this.db, this.client);
        this.tasks = new Tasks(this.db, this.client);
        this.experiments = new Experiments(this.db, this.client);
        this.gateways = new Gateways(this.db, this.client);
        this.tensorboards = new TensorBoards(this.db, this.client);
        this.devenvs = new Devenvs(this.db, this.client);
        this.optunaboards = new OptunaBoards(this.db, this.client);
        this.triggersTree = new TriggersTree(this.db, this.client);
        this.pipelineDrivers = new PipelineDrivers(this.db, this.client);
        this.webhooks = {
            status: new WebhookStatus(this.db, this.client),
            result: new WebhookResult(this.db, this.client),
        };
        if (createIndices) {
            await this._createIndices();
        }
    }

    async _createIndices() {
        await this.dataSources.init();
        await this.snapshots.init();
        await this.pipelines.init();
        await this.algorithms.init();
        await this.jobs.init();
        await this.tasks.init();
        await this.experiments.init();
        await this.gateways.init();
        await this.tensorboards.init();
        await this.devenvs.init();
        await this.optunaboards.init();
        await this.triggersTree.init();
        await this.webhooks.status.init();
        await this.webhooks.result.init();
    }

    get isConnected() {
        return this._isConnected;
    }

    async close(force = false) {
        await this.client.close(force);
        this._isConnected = false;
    }

    isFatal(err) {
        return (err instanceof MongoError);
    }
}

module.exports = MongoDB;
