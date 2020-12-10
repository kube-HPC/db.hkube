const Collection = require('../Collection');
const collections = require('../collections');
const Readme = require('./readme');
const { queryMapper } = require('../utils');
/** @typedef {import('../../Pipeline').Pipeline} Pipeline */

/** @augments {Collection<Pipeline>} */
class Pipelines extends Collection {
    constructor(db, client) {
        super(db, client, collections.Pipelines.Store);
        this.readme = new Readme(db, client);
    }

    async init() {
        await super.init();
        await this.readme.init();
    }

    /**
     * @param {Pipeline} pipeline
     * @param {object} options
     */
    async create(pipeline, options) {
        return super.create(pipeline, options);
    }

    async fetch({ name }) {
        const entry = await super.fetch({ name }, { excludeId: true });
        return entry;
    }

    /**
     * @param {Pipeline} pipeline
     * @returns {Promise<Pipeline>}
     */
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
        pipelineType,
        algorithmName,
        fields = {},
        sort = null,
        hasCron = undefined,
        hasCronEnabled = undefined,
        hasCronTriggers = undefined,
        hasPipelinesTriggers = undefined,
        limit = 0,
    }) {
        const query = {
            ...queryMapper('experimentName', experimentName),
            ...queryMapper('name', pipelineName),
            ...queryMapper('types', pipelineType),
            ...queryMapper('nodes.algorithmName', algorithmName),
            ...queryMapper('triggers.cron.enabled', hasCronEnabled),
            ...(hasCronTriggers !== undefined && { 'triggers.cron': { $exists: true } }),
            ...(hasPipelinesTriggers && {
                'triggers.pipelines': { $exists: true },
                $where: 'this.triggers.pipelines.length > 0',
            }),
            ...(hasCron !== undefined && { 'triggers.cron': { $exists: hasCron } }),
        };
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
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = Pipelines;
