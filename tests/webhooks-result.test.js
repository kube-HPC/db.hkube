const { expect } = require('chai');
const connect = require('./connect');
const { generateWebhook } = require('./common');

describe('Webhooks-Result', () => {
    it('should throw error itemNotFound', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const promise = db.webhooks.result.fetch(webhook);
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        await db.webhooks.result.create(webhook);
        const promise = db.webhooks.result.create(webhook);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        const res1 = await db.webhooks.result.create(webhook);
        const res2 = await db.webhooks.result.fetch({ jobId });
        expect(res1).to.eql(res2);
    });
    it('should create and update webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        const params = { ttl: 60 };
        await db.webhooks.result.create(webhook);
        await db.webhooks.result.update({ ...params, jobId });
        const res = await db.webhooks.result.fetch({ jobId });
        expect(res).to.eql({ ...webhook, ...params });
    });
    it('should create and patch webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        const params = { ttl: 60 };
        await db.webhooks.result.create(webhook);
        await db.webhooks.result.patch({ ...params, jobId });
        const res = await db.webhooks.result.fetch({ jobId });
        expect(res).to.eql({ ...webhook, ...params });
    });
    it('should create and upsert webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        await db.webhooks.result.upsert(webhook);
        const res = await db.webhooks.result.fetch({ jobId });
        expect(res).to.eql(webhook);
    });
    it('should create and delete webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        await db.webhooks.result.create(webhook);
        await db.webhooks.result.delete({ jobId });
        const promise = db.webhooks.result.fetch({ jobId });
        await expect(promise).to.be.rejectedWith(/could not find/i);
    });
    it('should create and fetch webhook list', async () => {
        const db = await connect();
        const webhook1 = generateWebhook();
        const webhook2 = generateWebhook();
        const webhook3 = generateWebhook();
        await db.webhooks.result.create(webhook1);
        await db.webhooks.result.create(webhook2);
        await db.webhooks.result.create(webhook3);
        const list = await db.webhooks.result.fetchAll();
        expect(list.length).to.be.greaterThan(2);
    });
});
