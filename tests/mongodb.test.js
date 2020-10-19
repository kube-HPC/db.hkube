const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.test') });
const uuid = require('uuid');
const { expect } = require('chai');
const DB = require('./../');

/**
 * @typedef {import('mongodb').MongoClientOptions} MongoClientOptions
 * @typedef {import('../lib/MongoDB').ProviderInterface} ProviderInterface
 */

/** @type {ProviderInterface[]} */
const openConnections = []; // holds all the connections "connect" has created to disconnect after testing is done

/** @param {MongoClientOptions} config */
const connect = async (config = {}) => {
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
    openConnections.push(db);
    return db;
};

describe('MongoDB', () => {
    after(async () => {
        await Promise.all(
            openConnections.map(connection => connection.close())
        );
    });

    it('should bootstrap MongoDB connection amd disconnect', async () => {
        const db = await connect();
        expect(db.isConnected).to.be.true;
        await db.close();
        expect(db.isConnected).to.be.false;
    });

    it('should create and fetch and delete a datasource', async () => {
        const db = await connect();
        const name = uuid.v4();
        const insertedId = await db.dataSources.create(name);
        expect(insertedId).to.be.string;
        const dataSource = await db.dataSources.fetch({ name });
        expect(dataSource.name).to.equal(name);
        expect(dataSource.id).to.be.string;
        const fetchedById = await db.dataSources.fetch({ id: insertedId });
        expect(fetchedById).to.eql(dataSource);
        const deletedId = await db.dataSources.delete(dataSource.id);
        expect(deletedId).to.eq(dataSource.id);
    });

    it('should fetch all the dataSources', async () => {
        const db = await connect();
        const names = new Array(5).fill(0).map(() => uuid.v4());
        await Promise.all(names.map(db.dataSources.create));
        const dataSources = await db.dataSources.fetchAll();
        names.forEach(name => {
            const entry = dataSources.find(item => item.name === name);
            expect(entry.id).to.be.string;
        });
    });

    it('should throw an error if no id or name is passed to fetch', async () => {
        const db = await connect();
        // @ts-ignore
        await expect(db.dataSources.fetch()).to.be.rejected;
        await expect(db.dataSources.fetch({})).to.be.rejected;
    });

    it('should throw an error if no id passed to delete', async () => {
        const db = await connect();
        await expect(db.dataSources.delete('')).to.be.rejected;
    });

    it('should return null if deleting a non existing entry', async () => {
        const db = await connect();
        await expect(db.dataSources.delete('non-existing')).to.eventually.eq(
            null
        );
    });
});
