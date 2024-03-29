const { expect } = require('chai');
const uuid = require('uuid').v4;
const DBConnection = require('./../');
const connect = require('./connect');
const { ObjectID, MongoError } = require('mongodb');
const { generateEntries } = require('./common');
// a valid mongo ObjectID;
const nonExistingId = new ObjectID().toHexString();

const generateMockPipelineNames = (amount = 5) =>
    new Array(amount).fill(0).map((_, idx) => `pipeline-${idx}-${uuid()}`);

describe('Collection', () => {
    after(async () => {
        await Promise.all(connect.openConnections.map(connection => connection.close()));
    });
    describe('setup', () => {
        it('should throw invalid provider error', () => {
            expect(() => DBConnection({}, 'invalid-provider')).to.throw(
                /invalid provider/i
            );
        });
        it('should throw invalid config error', () => {
            expect(() => DBConnection({ invalid: '' })).to.throw(
                /invalid config/i
            );
        });
        it.skip('should throw ENOTFOUND', async () => {
            const promise = connect({
                host: 'no_such_host',
                serverSelectionTimeoutMS: 500,
            });
            await expect(promise).to.be.rejectedWith(/getaddrinfo ENOTFOUND/i);
        });
        it('should throw ECONNREFUSED', async () => {
            const promise = connect({
                port: 9999,
                connectionMethod: 'mongodb',
                serverSelectionTimeoutMS: 500,
            });
            await expect(promise).to.be.rejectedWith(/connect ECONNREFUSED/i);
        });
        // test not deterministic. assumes that the server cannot answer in less than 1 ms
        xit('should throw server selection timed out', async () => {
            const promise = connect({
                serverSelectionTimeoutMS: 1,
                reconnect: true,
                // heartbeatFrequencyMS: 1000
            });
            await expect(promise).to.be.rejectedWith(
                /Server selection timed out/i
            );
        });
        it('should bootstrap MongoDB connection and disconnect', async () => {
            const db = await connect();
            expect(db.isConnected).to.be.true;
            await db.close();
            expect(db.isConnected).to.be.false;
        });
    });
    describe('delete', () => {
        it.skip('should throw an error if both id and name are provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete({ name: 'joe', id: 'some id' })
            ).to.be.rejectedWith(/only one of | id/i);
        });
        it.skip('should throw an error if no id provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete({ id: undefined })
            ).to.be.rejectedWith(/you did not provide name | id/i);
        });
        it.skip('should throw an error invalid id provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete({ id: 'not an id' })
            ).to.be.rejectedWith(/invalid id/i);
        });
        it('should throw not found error if on non existing id', async () => {
            const db = await connect();
            const response = db.dataSources.delete(
                { id: nonExistingId },
                { allowNotFound: false }
            );
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
            const name = uuid();
            const created = await db.pipelines.create(
                { name },
                { applyId: true }
            );
            expect(created.name).to.eql(name);
            expect(created).to.have.property('id');
            expect(created).not.to.have.property('_id');
        });
        it('should create object without id', async () => {
            const db = await connect();
            const name = uuid();
            const created = await db.pipelines.create(
                { name },
                { applyId: false }
            );
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
            await expect(db.dataSources.fetch()).to.be.rejected;
            await expect(db.dataSources.fetch({})).to.be.rejected;
        });
        it.skip('should throw an error if both id and name are provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.fetch({ name: 'name', id: '123' })
            ).to.be.rejectedWith(/only one of/i);
        });
        it('should throw an error if invalid id provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.fetch({ id: 'not an id' })
            ).to.be.rejectedWith(/invalid id/i);
        });
        it('should throw not found error for non existing id', async () => {
            const db = await connect();
            const promise = db.dataSources.fetch(
                { id: nonExistingId },
                { allowNotFound: false }
            );
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
        it('should throw missing parameters', async () => {
            const db = await connect();
            await expect(db.dataSources.fetchMany({})).to.be.rejectedWith(
                /you did not provide names | ids/i
            );
        });
    });
    describe('fetch many', () => {
        it('should throw missing ids and names', async () => {
            const db = await connect();
            const promise = db.pipelines.fetchMany({});
            await expect(promise).to.be.rejectedWith(
                'you did not provide names | ids'
            );
        });
        it('should fetch many by id', async () => {
            const db = await connect();
            const { entries } = generateEntries(5);
            const created = await Promise.all(
                entries.map(d => db.dataSources.create(d))
            );
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
    });
    describe('fetchAll', () => {
        it('should fetch all pipelines', async () => {
            const db = await connect();
            const names = generateMockPipelineNames();

            await Promise.all(names.map(name => db.pipelines.create({ name })));
            const response = await db.pipelines.fetchMany({ names });
            expect(response.length).to.be.gte(names.length);
            response.forEach(entry => {
                expect(entry).to.haveOwnProperty('id');
                expect(entry).to.haveOwnProperty('name');
            });
        });
    });

    describe('isFatal', () => {
        it('is fatal', async () => {
            const db = await connect();
            expect(db.isFatal(new Error())).to.eql(false);
            expect(db.isFatal(new MongoError('dd'))).to.eql(true);
        });
    });


});
