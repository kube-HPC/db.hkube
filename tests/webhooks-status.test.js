const { expect } = require('chai');
const connect = require('./connect');
const { generateWebhook } = require('./common');

describe('Webhooks-Status', () => {
    it('should not throw error itemNotFound', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const response = await db.webhooks.status.fetch(webhook);
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        await db.webhooks.status.create(webhook);
        const promise = db.webhooks.status.create(webhook);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        const res1 = await db.webhooks.status.create(webhook);
        const res2 = await db.webhooks.status.fetch({ jobId });
        expect(res1).to.eql(res2);
    });
    it('should create and update webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        const params = { ttl: 60 };
        await db.webhooks.status.create(webhook);
        await db.webhooks.status.update({ ...params, jobId });
        const res = await db.webhooks.status.fetch({ jobId });
        expect(res).to.eql({ ...webhook, ...params });
    });
    it('should create and patch webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        const params = { ttl: 60 };
        await db.webhooks.status.create(webhook);
        await db.webhooks.status.patch({ ...params, jobId });
        const res = await db.webhooks.status.fetch({ jobId });
        expect(res).to.eql({ ...webhook, ...params });
    });
    it('should create and delete webhook', async () => {
        const db = await connect();
        const webhook = generateWebhook();
        const { jobId } = webhook;
        await db.webhooks.status.create(webhook);
        await db.webhooks.status.delete({ jobId });
        const response = await db.webhooks.status.fetch({ jobId });
        expect(response).to.be.null;
    });
    it('should create and fetch webhook list', async () => {
        const db = await connect();
        const webhook1 = generateWebhook();
        const webhook2 = generateWebhook();
        const webhook3 = generateWebhook();
        await db.webhooks.status.create(webhook1);
        await db.webhooks.status.create(webhook2);
        await db.webhooks.status.create(webhook3);
        const list = await db.webhooks.status.fetchAll();
        expect(list.length).to.be.greaterThan(2);
    });
});
