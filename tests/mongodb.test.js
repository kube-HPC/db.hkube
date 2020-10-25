const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.test') });
const uuid = require('uuid');
const { expect } = require('chai');
const DBConnection = require('./../');
const connect = require('./connect');
const { ObjectID } = require('mongodb');
// a valid mongo ObjectID;
const nonExistingId = new ObjectID().toHexString();

describe('MongoDB', () => {
    it('should bootstrap MongoDB connection amd disconnect', async () => {
        const db = await connect();
        expect(db.isConnected).to.be.true;
        await db.close();
        expect(db.isConnected).to.be.false;
    });

    it('should create and fetch and delete a datasource', async () => {
        const db = await connect();
        const name = uuid.v4();
        const { id: insertedId } = await db.dataSources.create(name);
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
        // @ts-expect-error
        await expect(db.dataSources.fetch()).to.be.rejected;
        await expect(db.dataSources.fetch({})).to.be.rejected;
    });

    it('should throw an error if no id passed to delete', async () => {
        const db = await connect();
        await expect(db.dataSources.delete('')).to.be.rejectedWith(
            /did not provide id/i
        );
    });

    it('should throw an error if both id and name are passed to fetch', async () => {
        const db = await connect();
        await expect(
            db.dataSources.fetch({ name: 'name', id: '123' })
        ).to.be.rejectedWith(/only one of/i);
    });

    it('should throw an error invalid id passed to fetch', async () => {
        const db = await connect();
        await expect(
            db.dataSources.fetch({ id: 'not an id' })
        ).to.be.rejectedWith(/invalid id/i);
    });

    it('should throw an error invalid id passed to delete', async () => {
        const db = await connect();
        await expect(db.dataSources.delete('not an id')).to.be.rejectedWith(
            /invalid id/i
        );
    });

    it('should throw not found error if deleting a non existing id', async () => {
        const db = await connect();
        await expect(db.dataSources.delete(nonExistingId)).to.be.rejectedWith(
            /could not find/i
        );
    });

    it('should throw not found error if fetching a non existing id', async () => {
        const db = await connect();
        await expect(
            db.dataSources.fetch({ id: nonExistingId })
        ).to.be.rejectedWith(/could not find/i);
    });

    it('should throw invalid provider error', () => {
        // @ts-expect-error
        expect(() => DBConnection({}, 'invalid-provider')).to.throw(
            /invalid provider/i
        );
    });

    it('should throw invalid config error', () => {
        // @ts-expect-error
        expect(() => DBConnection({ invalid: '' })).to.throw(/invalid config/i);
    });
});
