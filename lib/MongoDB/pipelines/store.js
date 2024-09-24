const Collection = require('../Collection');
const collections = require('../collections');
const Readme = require('./readme');
const Query = require('../Query');
const Versions = require('../versions');

class Pipelines extends Collection {
    constructor(db, client) {
        super(db, client, collections.Pipelines.Store);
        this.readme = new Readme(db, client);
        this.versions = new Versions(db, client);
    }

    async init() {
        await super.init();
        await this.readme.init();
    }

    async create(pipeline, options) {
        return super.create(pipeline, options);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    async update(pipeline) {
        const { name } = pipeline;
        await super.updateOne({
            filter: { name },
            query: { $set: pipeline },
        });
        return pipeline;
    }

    async replace(pipeline) {
        const { name } = pipeline;
        await super.replaceOne({
            filter: { name },
            replacement: pipeline,
        });
        return pipeline;
    }

    async patch(pipeline) {
        const entry = await super.patch({
            query: { name: pipeline.name },
            data: pipeline,
        });
        return entry;
    }

    async delete({ name }) {
        const { deleted } = await super.delete({ name });
        const { deleted: readme } = await this.readme.delete({ name });
        return { deleted: deleted + readme };
    }

    async deleteMany({ names }) {
        const { deleted } = await super.deleteMany(
            { name: { $in: names } },
            { allowNotFound: true }
        );
        return { deleted };
    }

    async search({
        experimentName,
        pipelineName,
        pipelinesNames,
        pipelineType,
        algorithmName,
        fields = {},
        sort = null,
        triggersPipeline = undefined,
        hasCronEnabled = undefined,
        hasCronTriggers = undefined,
        hasPipelinesTriggers = undefined,
        isConcurrencyReject,
        limit = 0,
    }) {
        const query = new Query()
            .addParam('experimentName', experimentName)
            .addParam('name', pipelineName)
            .addInArray('name', pipelinesNames)
            .addParam('types', pipelineType)
            .addParam('nodes.algorithmName', algorithmName)
            .addParam('triggers.cron.enabled', hasCronEnabled)
            .addParam('triggers.pipelines', triggersPipeline)
            .addParam('options.concurrentPipelines.rejectOnFailure', isConcurrencyReject)
            .addExists({ 'triggers.cron': hasCronTriggers })
            .addArrayGt('triggers.pipelines', hasPipelinesTriggers, 0)
            .create();

        const entry = await super.fetchAll({
            query,
            sort,
            limit,
            fields,
            excludeId: true,
        });
        return entry;
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
}

module.exports = Pipelines;
