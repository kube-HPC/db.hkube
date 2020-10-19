const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.test') });
const { expect } = require('chai');
const DB = require('./../');
const { PassThrough } = require('stream');

/**
 * @typedef {import('mongodb').MongoClientOptions} MongoClientOptions
 * @typedef {import('../lib/MongoDB').DBInterface} DBInterface
 */

/** @type {(config?: MongoClientOptions) => Promise<DBInterface>} */
const getDb = async (config = {}) => {
    const db = DB('MongoDB', {
        MongoDB: {
            auth: {
                user: process.env.DB_USER_NAME,
                password: process.env.DB_PASSWORD,
            },
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10),
            dbName: process.env.DB_NAME,
            useUnifiedTopology: true,
            ...config,
        },
    });
    await db.init();
    return db;
};

describe('MongoDB', () => {
    afterEach(async () => {
        const db = await getDb();
        // using a hidden property of the class
        // @ts-ignore
        await db.db.collection('dataSources').remove({});
        await db.close();
    });

    it('should bootstrap MongoDB connection amd disconnect', async () => {
        const db = await getDb();
        expect(db.isConnected).to.be.true;
        await db.close();
        expect(db.isConnected).to.be.false;
        await db.close();
    });

    it('should create and fetch a datasource', async () => {
        const db = await getDb();
        const name = 'my-dataSource';
        db.dataSources.create(name);
        const dataSource = await db.dataSources.fetch({ name });
        expect(dataSource.name).to.equal(name);
        expect(dataSource.id).to.be.string;
        await db.close();
    });
});
