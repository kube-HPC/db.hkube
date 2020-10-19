const { expect } = require('chai');
const DB = require('./../');

/**
 * @typedef {import('mongodb').MongoClientOptions} MongoClientOptions
 * @typedef {import('../lib/MongoDB').DBInterface} DBInterface
 */

/** @type {(config?: MongoClientOptions) => Promise<DBInterface>} */
const getDb = async (config = {}) => {
    const db = DB('MongoDB', {
        MongoDB: {
            host: 'mongodb://localhost',
            port: 27017,
            dbName: 'test',
            useUnifiedTopology: true,
            ...config,
        },
    });
    await db.init();
    return db;
};

describe('MongoDB', () => {
    it.only('should bootstrap MongoDB connection amd disconnect', async () => {
        const db = await getDb();
        expect(db.isConnected).to.be.true;
        await db.close();
        expect(db.isConnected).to.be.false;
    });
    it('should create and fetch a datasource', async () => {
        const db = await getDb();
        const name = 'my-dataSource';
        db.dataSources.create(name);
        db.dataSources.fetch({ name });
    });
});
