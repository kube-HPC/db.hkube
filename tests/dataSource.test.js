const { expect } = require('chai');
const uuid = require('uuid').v4;
const connect = require('./connect');
const { generateEntries } = require('./utils');

/** @typedef {import('../lib/DataSource').FileMeta} FileMeta */

/** @type {(amount?: number) => FileMeta[]} */
const generateMockFiles = (amount = 4) =>
    new Array(amount).fill(0).map((file, ii) => ({
        id: `file-${ii}`,
        name: `file-${ii}-${uuid()}`,
        path: `path-${ii}`,
        size: 1,
        type: Math.random() > 0.5 ? 'csv' : 'md',
        uploadedAt: new Date().getTime(),
    }));

const versionId = 'my-hash';
describe('DataSources', () => {
    it('should throw conflict error when name already exists', async () => {
        const db = await connect();
        const name = uuid();
        const firstResponse = await db.dataSources.create({ name });
        expect(firstResponse).to.be.string;
        const promise = db.dataSources.create({ name });
        await expect(promise).to.be.rejectedWith(
            'could not create dataSource, name is already taken'
        );
    });
    it('should create and fetch and delete a datasource by id', async () => {
        const db = await connect();
        const name = uuid();
        const { id: insertedId } = await db.dataSources.create({ name });
        expect(insertedId).to.be.string;
        const dataSource = await db.dataSources.fetch({ id: insertedId });
        expect(dataSource.name).to.equal(name);
        expect(dataSource.id).to.be.string;
        const fetchedById = await db.dataSources.fetch({ id: insertedId });
        expect(fetchedById).to.eql(dataSource);
        expect(fetchedById.versionDescription).to.eql('initial version');
        expect(fetchedById.files).to.exist;
        expect(fetchedById.files).to.have.lengthOf(0);
        const response = await db.dataSources.delete({ id: insertedId });
        expect(response).to.eql({ deleted: 1 });
    });
    it('should create and fetch and delete a datasource by name', async () => {
        const db = await connect();
        const name = uuid();
        await db.dataSources.create({ name });
        const dataSource = await db.dataSources.fetch({ name });
        expect(dataSource.name).to.equal(name);
        expect(dataSource.id).to.be.string;
        expect(dataSource).not.to.haveOwnProperty('_id');
        expect(dataSource.id).to.be.string;
        const fetchedByName = await db.dataSources.fetch({ name });
        expect(fetchedByName).to.eql(dataSource);
        const response = await db.dataSources.delete({ name });
        expect(response).to.eql({ deleted: 1 });
    });
    it('should list all the dataSources without their files list and avoid partial versions', async () => {
        const db = await connect();
        const name = uuid();
        const created = await db.dataSources.create({ name });
        const firstFetch = await db.dataSources.listDataSources();
        // at first it is marked as partial and should not be fetched
        expect(firstFetch.find(item => item.id === created.id)).to.be.undefined;
        // tags the dataSource as non partial and now should be listed
        await db.dataSources.updateFiles({ id: created.id, files: [], versionId: 'no-version' });
        const entries = await db.dataSources.listDataSources();
        expect(entries.length).to.be.gte(1);
        expect(entries).not.to.all.keys('files');
    });
    describe('upload files', () => {
        it('should upload a list of files', async () => {
            const db = await connect();
            const name = uuid();
            const created = await db.dataSources.create({ name });
            expect(created.isPartial).to.be.true;
            /** @type {FileMeta[]} */
            const filesAdded = generateMockFiles();
            const uploadResponse = await db.dataSources.updateFiles({
                name,
                versionId,
                files: filesAdded,
            });
            expect(uploadResponse.files).to.have.lengthOf(4);
            expect(uploadResponse.files).to.eql(filesAdded);
            expect(uploadResponse.id).to.eq(created.id);
            expect(uploadResponse.isPartial).to.be.false;
        });
    });
    describe('versioning', () => {
        it('should create a new version', async () => {
            const db = await connect();
            const name = uuid();
            const createdResponse = await db.dataSources.create({ name });
            const newDescription = 'my new version';
            const updateResponse = await db.dataSources.createVersion({
                name,
                versionDescription: newDescription,
            });
            const {
                id: createdId,
                versionDescription: createdDescription,
                ...createdRest
            } = createdResponse;
            const {
                id: updatedId,
                versionDescription: updatedDescription,
                ...updatedRest
            } = updateResponse;

            expect(createdRest).to.eql(updatedRest);
            expect(updatedId).not.to.eq(createdId);
            expect(updatedDescription).to.eql(newDescription);
            expect(updateResponse).not.to.haveOwnProperty('_id');
        });
        it('should fetch the latest version given name only', async () => {
            const db = await connect();
            const name = uuid();
            await db.dataSources.create({ name });
            const updates = await Promise.all(
                new Array(4)
                    .fill(0)
                    .map((_, ii) => `update-${ii}`)
                    .map(newDescription =>
                        db.dataSources.createVersion({
                            name,
                            versionDescription: newDescription,
                        })
                    )
            );
            const fetchResponse = await db.dataSources.fetch({ name });
            const latest = updates[updates.length - 1];
            expect(fetchResponse).to.eql(latest);
        });
        it('should list all the versions of a given dataSource', async () => {
            const db = await connect();
            const name = uuid();
            await db.dataSources.create({ name });
            const versionIds = ['a', 'b', 'c', 'd'];
            for await (let vId of versionIds) {
                const nextVersion = await db.dataSources.createVersion({
                    name,
                    versionDescription: `created ${vId}`,
                });
                await db.dataSources.updateFiles({
                    id: nextVersion.id,
                    versionId: vId,
                    files: generateMockFiles(),
                });
            }
            const versionsResponse = await db.dataSources.listVersions({
                name,
            });
            // all the created versions + the initial version
            expect(versionsResponse).to.have.lengthOf(versionIds.length);
            versionsResponse.forEach(version => {
                expect(version).to.haveOwnProperty('id');
                expect(version).to.haveOwnProperty('versionDescription');
                expect(version).to.haveOwnProperty('versionId');
            });
        });
    });
    describe('fetch many', () => {
        it('should throw missing ids and names', async () => {
            const db = await connect();
            const promise = db.dataSources.fetchMany({});
            await expect(promise).to.be.rejectedWith('you did not provide names | ids');
        });
        it('should fetch many by id', async () => {
            const db = await connect();
            const { entries } = generateEntries(5);
            const created = await Promise.all(entries.map(entry => db.dataSources.create(entry)));
            await Promise.all(
                entries.map(entry =>
                    db.dataSources.updateFiles({
                        ...entry,
                        versionId: 'upload',
                    })
                )
            );
            const ids = created.map(entry => entry.id);
            const response = await db.dataSources.fetchMany({ ids });
            expect(response).to.have.lengthOf(5);
        });
        it('should fetch many by name', async () => {
            const db = await connect();
            const { entries, names } = generateEntries(5);
            await Promise.all(entries.map(entry => db.dataSources.create(entry)));
            await Promise.all(
                entries.map(entry =>
                    db.dataSources.updateFiles({
                        ...entry,
                        versionId: 'upload',
                    })
                )
            );
            const response = await db.dataSources.fetchMany({ names });
            expect(response).to.have.lengthOf(5);
        });
        it.skip('should fetch the latest version given name only', async () => {
            const db = await connect();
            const name = uuid();
            await db.dataSources.create({ name });
            // I think because this is parallel, you got an error sometimes...
            const updates = await Promise.all(
                new Array(4)
                    .fill(0)
                    .map((_, ii) => `update-${ii}`)
                    .map(newDescription =>
                        db.dataSources.updateVersion({
                            name,
                            versionDescription: newDescription,
                        })
                    )
            );
            const fetchResponse = await db.dataSources.fetch({ name });
            const latest = updates[updates.length - 1];
            expect(fetchResponse).to.eql(latest);
        });

        // it.only('should return all the dataSources metadata aggregation', async () => {
        //     const db = await connect();
        //     // const name = uuid();
        //     // const filesMeta = generateMockFiles(10);
        //     // await db.dataSources.create({ name });
        //     // await db.dataSources.uploadFiles({ name, filesAdded: filesMeta });
        //     const all = await db.dataSources.fetchAll();
        //     console.log(JSON.stringify(all, null, 2));
        // });
    });
});
