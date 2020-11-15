const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.test') });
const { expect } = require('chai');
const { v4: uuid } = require('uuid');
const DBConnection = require('./../');
const connect = require('./connect');
const { ObjectID } = require('mongodb');
const { generateEntries } = require('./utils');
// a valid mongo ObjectID;
const nonExistingId = new ObjectID().toHexString();

const generateMockPipelineNames = (amount = 5) =>
    new Array(amount).fill(0).map((_, idx) => `pipeline-${idx}-${uuid()}`);

describe('Collection', () => {
    describe('setup', () => {
        it('should throw invalid provider error', () => {
            // @ts-expect-error
            expect(() => DBConnection({}, 'invalid-provider')).to.throw(
                /invalid provider/i
            );
        });

        it('should throw invalid config error', () => {
            // @ts-expect-error
            expect(() => DBConnection({ invalid: '' })).to.throw(
                /invalid config/i
            );
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
        it('should bootstrap MongoDB connection amd disconnect', async () => {
            const db = await connect();
            expect(db.isConnected).to.be.true;
            await db.close();
            expect(db.isConnected).to.be.false;
        });
    });
    describe('delete', () => {
        it('should throw an error if both id and name are provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete({ name: 'joe', id: 'some id' })
            ).to.be.rejectedWith(/only one of | id/i);
        });
        it('should throw an error if no id provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete({ id: undefined })
            ).to.be.rejectedWith(/you did not provide name | id/i);
        });
        it('should throw an error invalid id provided', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete({ id: 'not an id' })
            ).to.be.rejectedWith(/invalid id/i);
        });
        it('should throw not found error if on non existing id', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete({ id: nonExistingId })
            ).to.be.rejectedWith(/could not find/i);
        });
        it('should return null for non existing id if allowNotFound', async () => {
            const db = await connect();
            await expect(
                db.dataSources.delete(
                    { id: nonExistingId },
                    { allowNotFound: true }
                )
            ).to.eventually.eq(null);
        });
    });
    describe('fetch', () => {
        it('should create an empty pipeline', async () => {
            const db = await connect();
            const name = 'a-new-pipeline';
            const created = await db.pipelines.create({ name });
            expect(created.name).to.eq(name);
            expect(created).to.have.property('id');
            expect(created).not.to.have.property('_id');
            expect(created.id).to.be.string;
        });
        it('should fetch all the dataSources', async () => {
            const db = await connect();
            const { entries, names } = generateEntries(5);
            await Promise.all(entries.map(db.dataSources.create));
            const dataSources = await db.dataSources.fetchAll();
            names.forEach(name => {
                const entry = dataSources.find(item => item.name === name);
                expect(entry).not.to.have.property('_id');
                expect(entry).to.have.property('id');
                expect(entry.id).to.be.string;
            });
        });
        it('should throw an error if no id or name is provided', async () => {
            const db = await connect();
            // @ts-expect-error
            await expect(db.dataSources.fetch()).to.be.rejected;
            await expect(db.dataSources.fetch({})).to.be.rejected;
        });
        it('should throw an error if both id and name are provided', async () => {
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
            await expect(
                db.dataSources.fetch({ id: nonExistingId })
            ).to.be.rejectedWith(/could not find/i);
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
            const names = generateMockPipelineNames();

            const created = await Promise.all(
                names.map(name => db.pipelines.create({ name }))
            );
            const ids = created.map(entry => entry.id);
            const response = await db.pipelines.fetchMany({ ids });
            expect(response).to.have.lengthOf(5);
        });
        it('should fetch many by name', async () => {
            const db = await connect();
            const names = generateMockPipelineNames();

            await Promise.all(names.map(name => db.pipelines.create({ name })));
            const response = await db.pipelines.fetchMany({ names });
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
});
