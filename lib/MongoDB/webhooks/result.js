const Collection = require('../Collection');
const collections = require('../collections');

class WebhookResult extends Collection {
    constructor(db, client) {
        super(db, client, collections.Webhooks.Result);
    }

    async create(webhook) {
        return super.create(webhook);
    }

    async fetch({ jobId }) {
        const entry = await super.fetch({ jobId }, { excludeId: true });
        return entry;
    }

    async update(webhook) {
        const { jobId } = webhook;
        const timestamp = Date.now();
        await super.updateOne({
            filter: { jobId },
            query: { $set: { ...webhook, timestamp } },
            upsert: true,
        });
        return webhook;
    }

    async patch(webhook) {
        const entry = await super.patch({
            query: { jobId: webhook.jobId },
            data: webhook,
        });
        return entry;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = WebhookResult;
