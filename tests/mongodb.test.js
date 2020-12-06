const uuid = require('uuid');
const { expect } = require('chai');
const DBConnection = require('./../');
const connect = require('./connect');
const { ObjectID } = require('mongodb');

// a valid mongo ObjectID;
const nonExistingId = new ObjectID().toHexString();
const { dummyFile } = require('./mocks');

const generateEntries = amount => {
    const names = new Array(amount).fill(0).map(() => uuid.v4());
    return {
        names,
        entries: names.map(name => ({ name, files: [dummyFile] })),
    };
};

describe('MongoDB', () => {
    describe('setup', () => {
        it('should throw invalid provider error', () => {
            // @ts-expect-error
            expect(() => DBConnection({}, 'invalid-provider')).to.throw(/invalid provider/i);
        });
        it('should throw invalid config error', () => {
            // @ts-expect-error
            expect(() => DBConnection({ invalid: '' })).to.throw(/invalid config/i);
        });
        it('should throw missing user name', async () => {
            await expect(
                // @ts-expect-error
                connect({ auth: { password: 'a' } })
            ).to.be.rejectedWith(/you did not provide user/i);
        });
        it('should throw missing password', async () => {
            // @ts-expect-error
            await expect(connect({ auth: { user: 'a' } })).to.be.rejectedWith(
                /you did not provide password/i
            );
        });
        it('should throw Authentication failed', async () => {
            const promise = connect({
                user: 'no_such_user',
            });
            await expect(promise).to.be.rejectedWith(/Authentication failed/i);
        });
        it('should throw ENOTFOUND', async () => {
            const promise = connect({
                host: 'no_such_host',
                serverSelectionTimeoutMS: 500,
            });
            await expect(promise).to.be.rejectedWith(/getaddrinfo ENOTFOUND/i);
        });
        it('should throw ECONNREFUSED', async () => {
            const promise = connect({
                port: 9999,
                serverSelectionTimeoutMS: 500,
            });
            await expect(promise).to.be.rejectedWith(/connect ECONNREFUSED/i);
        });
        it('should throw server selection timed out', async () => {
            const promise = connect({
                serverSelectionTimeoutMS: 1,
                reconnect: true,
                // heartbeatFrequencyMS: 1000
            });
            await expect(promise).to.be.rejectedWith(/Server selection timed out/i);
        });
        it('should bootstrap MongoDB connection amd disconnect', async () => {
            const db = await connect();
            expect(db.isConnected).to.be.true;
            await db.close();
            expect(db.isConnected).to.be.false;
        });
    });
    describe('delete', () => {
        it.skip('should throw an error if both id and name are provided', async () => {
            const db = await connect();
            await expect(db.dataSources.delete({ name: 'joe', id: 'some id' })).to.be.rejectedWith(
                /only one of | id/i
            );
        });
        it.skip('should throw an error if no id provided', async () => {
            const db = await connect();
            await expect(db.dataSources.delete({ id: undefined })).to.be.rejectedWith(
                /you did not provide name | id/i
            );
        });
        it('should throw an error invalid id provided', async () => {
            const db = await connect();
            await expect(db.dataSources.delete({ id: 'not an id' })).to.be.rejectedWith(
                /invalid id/i
            );
        });
        it('should throw not found error if on non existing id', async () => {
            const db = await connect();
            const response = db.dataSources.delete({ id: nonExistingId }, { allowNotFound: false });
            await expect(response).to.be.rejectedWith(/could not find/i);
        });
        it('should return null for non existing id if allowNotFound', async () => {
            const db = await connect();
            const response = await db.dataSources.delete(
                { id: nonExistingId },
                { allowNotFound: true }
            );
            expect(response).to.eql({ deleted: 0 });
        });
    });
    describe('fetch', () => {
        it('should create object with id', async () => {
            const db = await connect();
            const name = uuid.v4();
            const created = await db.pipelines.create({ name }, { applyId: true });
            expect(created.name).to.eql(name);
            expect(created).to.have.property('id');
            expect(created).not.to.have.property('_id');
        });
        it('should create object without id', async () => {
            const db = await connect();
            const name = uuid.v4();
            const created = await db.pipelines.create({ name }, { applyId: false });
            expect(created.name).to.eql(name);
            expect(created).to.not.not.have.property('id');
            expect(created).not.to.have.property('_id');
        });
        it('should fetch all the dataSources', async () => {
            const db = await connect();
            const { entries, names } = generateEntries(5);
            await Promise.all(entries.map(d => db.dataSources.create(d)));
            const dataSources = await db.dataSources.fetchAll();
            names.forEach(name => {
                const entry = dataSources.find(item => item.name === name);
                expect(entry).not.to.have.property('_id');
                expect(entry).to.have.property('id');
                expect(entry.id).to.be.string;
            });
        });
        it.skip('should throw an error if no id or name is provided', async () => {
            const db = await connect();
            // @ts-expect-error
            await expect(db.dataSources.fetch()).to.be.rejected;
            await expect(db.dataSources.fetch({})).to.be.rejected;
        });
        it.skip('should throw an error if both id and name are provided', async () => {
            const db = await connect();
            await expect(db.dataSources.fetch({ name: 'name', id: '123' })).to.be.rejectedWith(
                /only one of/i
            );
        });
        it('should throw an error if invalid id provided', async () => {
            const db = await connect();
            await expect(db.dataSources.fetch({ id: 'not an id' })).to.be.rejectedWith(
                /invalid id/i
            );
        });
        it('should throw not found error for non existing id', async () => {
            const db = await connect();
            const promise = db.dataSources.fetch({ id: nonExistingId }, { allowNotFound: false });
            await expect(promise).to.be.rejectedWith(/could not find/i);
        });
        it('should not throw not found error for non existing id', async () => {
            const db = await connect();
            const promise = await db.dataSources.fetch(
                { id: nonExistingId },
                { allowNotFound: true }
            );
            expect(promise).to.be.null;
        });
        it('should fetch many by id', async () => {
            const db = await connect();
            const { entries } = generateEntries(5);
            const created = await Promise.all(entries.map(d => db.dataSources.create(d)));
            const ids = created.map(entry => entry.id);
            const response = await db.dataSources.fetchMany({ ids });
            expect(response).to.have.lengthOf(5);
        });
        it('should fetch many by name', async () => {
            const db = await connect();
            const { entries, names } = generateEntries(5);
            await Promise.all(entries.map(d => db.dataSources.create(d)));
            const response = await db.dataSources.fetchMany({ names });
            expect(response).to.have.lengthOf(5);
        });
        it('should throw missing parameters', async () => {
            const db = await connect();
            await expect(db.dataSources.fetchMany({})).to.be.rejectedWith(
                /you did not provide names | ids/i
            );
        });
    });
});
