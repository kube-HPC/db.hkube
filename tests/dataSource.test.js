const { expect } = require('chai');
const uuid = require('uuid').v4;
const connect = require('./connect');
const { generateEntries, generateMockFiles } = require('./utils');

const commitHash = 'my-hash';

/** @typedef {import('../lib/DataSource').FileMeta} FileMeta */
/** @typedef {import('../lib/Provider').ProviderInterface} ProviderInterface */
/** @type {ProviderInterface} */
let db = null;

/** @param {ProviderInterface} db */
const _createDataSource = db => name =>
    /** @ts-ignore */
    db.dataSources.create({ name, git: null, storage: null });

let createDataSource = null;

/** @type {(name: string, versionsCount: number) => Promise<null>} */
let createDataSourceWithVersions = null;

/** @type {(db: ProviderInterface) => typeof createDataSourceWithVersions} */
const _createDataSourceWithVersions = db => async (name, versionsCount) => {
    await createDataSource(name);
    const versions = [...new Array(versionsCount).keys()]; // [0, ...versionsCount]
    for await (const idx of versions) {
        const response = await db.dataSources.createVersion({
            name,
            versionDescription: `version -${idx}`,
        });
        await db.dataSources.updateFiles({
            id: response.id,
            commitHash: 'upload',
            files: [],
        });
    }
    return null;
};

describe('DataSources', () => {
    before(async () => {
        db = await connect();
        createDataSource = _createDataSource(db);
        createDataSourceWithVersions = _createDataSourceWithVersions(db);
    });
    it('should throw conflict error when name already exists', async () => {
        const name = uuid();
        const firstResponse = await createDataSource(name);
        expect(firstResponse).to.be.string;
        const promise = createDataSource(name);
        await expect(promise).to.be.rejectedWith(
            'could not create dataSource, name is already taken'
        );
    });
    it.skip('should create and fetch and delete a datasource by id', async () => {
        const name = uuid();
        const { id: insertedId } = await createDataSource(name);
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
        const name = uuid();
        const createdDataSource = await createDataSource(name);
        expect(createdDataSource).not.to.haveOwnProperty('_credentials');
        expect(createdDataSource).to.haveOwnProperty('isPartial');
        const dataSource = await db.dataSources.fetch({ name });
        expect(dataSource).not.to.haveOwnProperty('_credentials');
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
        const name = uuid();
        const created = await createDataSource(name);
        const firstFetch = await db.dataSources.listDataSources();
        // at first it is marked as partial and should not be fetched
        expect(firstFetch.find(item => item.id === created.id)).to.be.undefined;
        // tags the dataSource as non partial and now should be listed
        await db.dataSources.updateFiles({
            id: created.id,
            files: [],
            commitHash: 'no-version',
        });
        const entries = await db.dataSources.listDataSources();
        expect(entries.length).to.be.gte(1);
        expect(entries).not.to.all.keys('files');
    });
    describe('upload files', () => {
        it('should upload a list of files', async () => {
            const name = uuid();
            const created = await createDataSource(name);
            expect(created.isPartial).to.be.true;
            /** @type {FileMeta[]} */
            const filesAdded = generateMockFiles();
            const uploadResponse = await db.dataSources.updateFiles({
                name,
                commitHash,
                files: filesAdded,
            });
            expect(uploadResponse).to.have.keys(
                'name',
                'versionDescription',
                'files',
                'commitHash',
                'id',
                'fileTypes',
                'totalSize',
                'avgFileSize',
                'filesCount',
                'git',
                'storage'
            );
            expect(uploadResponse.files).to.have.lengthOf(4);
            expect(uploadResponse.files).to.eql(filesAdded);
            expect(uploadResponse.id).to.eq(created.id);
            // expect(uploadResponse.isPartial).to.be.false;
        });
    });
    describe('versioning', () => {
        it('should create a new version', async () => {
            const name = uuid();
            const createdResponse = await createDataSource(name);
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
                _credentials,
                ...updatedRest
            } = updateResponse;
            expect(updateResponse).to.haveOwnProperty('_credentials');
            expect(createdRest).to.eql(updatedRest);
            expect(updatedId).not.to.eq(createdId);
            expect(updatedDescription).to.eql(newDescription);
            expect(updateResponse).not.to.haveOwnProperty('_id');
        });
        it('should fetch the latest version given name only', async () => {
            const name = uuid();
            await createDataSource(name);
            const updates=[];
            for (let ii=0;ii<4;ii++){
                const update = await db.dataSources.createVersion({
                    name,
                    versionDescription: `update-${ii}`
                })
                updates.push(update);
            }
            const fetchResponse = await db.dataSources.fetch({ name });
            const { _credentials, ...latest } = updates[updates.length - 1];
            expect(fetchResponse).to.eql(latest);
        });
        it('should list all the versions of a given dataSource', async () => {
            const name = uuid();
            const versionsCount = 5;
            await createDataSourceWithVersions(name, versionsCount);
            const response = await db.dataSources.listVersions({ name });
            expect(response).to.have.lengthOf(versionsCount);
            const versionsResponse = await db.dataSources.listVersions({
                name,
            });
            // all the created versions + the initial version
            expect(versionsResponse).to.have.lengthOf(versionsCount);
            versionsResponse.forEach(version => {
                expect(version).to.haveOwnProperty('id');
                expect(version).to.haveOwnProperty('versionDescription');
                expect(version).to.haveOwnProperty('commitHash');
            });
        });
    });
    describe('fetch many', () => {
        it('should throw missing ids and names', async () => {
            const promise = db.dataSources.fetchMany({});
            await expect(promise).to.be.rejectedWith(
                'you did not provide names | ids'
            );
        });
        it('should fetch many by id', async () => {
            const { entries } = generateEntries(5);
            const created = await Promise.all(
                entries.map(entry =>
                    db.dataSources.create({
                        ...entry,
                        git: null,
                        storage: null,
                    })
                )
            );
            await Promise.all(
                entries.map(entry =>
                    db.dataSources.updateFiles({
                        ...entry,
                        commitHash: 'upload',
                    })
                )
            );
            const ids = created.map(entry => entry.id);
            const response = await db.dataSources.fetchMany({ ids });
            expect(response).to.have.lengthOf(5);
        });
        it('should fetch many by name', async () => {
            const { entries, names } = generateEntries(5);
            await Promise.all(
                entries.map(entry =>
                    db.dataSources.create({
                        ...entry,
                        git: null,
                        storage: null,
                    })
                )
            );
            await Promise.all(
                entries.map(entry =>
                    db.dataSources.updateFiles({
                        ...entry,
                        commitHash: 'upload',
                    })
                )
            );
            const response = await db.dataSources.fetchMany({ names });
            expect(response).to.have.lengthOf(5);
        });
        it('should fetch the latest version given name only', async () => {
            const name = uuid();
            await createDataSource(name);
            const descriptions = new Array(4)
                .fill(0)
                .map((_, ii) => `update-${ii}`);

            for await (const versionDescription of descriptions) {
                const createdVersion = await db.dataSources.createVersion({
                    name,
                    versionDescription,
                });
                await db.dataSources.updateFiles({
                    id: createdVersion.id,
                    files: [],
                    commitHash: '',
                });
            }

            const fetchResponse = await db.dataSources.fetch({ name });
            const latest = descriptions[descriptions.length - 1];
            expect(fetchResponse.versionDescription).to.eql(latest);
        });
    });
    describe('update credentials', () => {
        const updatedContent = {
            git: {
                token: 'new-token',
            },
            storage: {
                accessKeyId: 'new-id',
                secretAccessKey: 'new-secret',
            },
        };
        /** @param {import('../lib/DataSource').Credentials} credentials */
        const createAndUpdateCredentials = async (
            name,
            versionsCount,
            credentials
        ) => {
            await createDataSourceWithVersions(name, versionsCount);
            return db.dataSources.updateCredentials({
                name,
                credentials,
            });
        };

        it('should update both storage and git', async () => {
            const name = uuid();
            const versionsCount = 5;
            const updatedCount = await createAndUpdateCredentials(
                name,
                versionsCount,
                updatedContent
            );
            expect(updatedCount).to.eq(versionsCount + 1); // +1 for the initial version
            const latest = await db.dataSources.fetchWithCredentials({ name });
            expect(latest).to.haveOwnProperty('_credentials');
            expect(latest._credentials).eql(updatedContent);
        });

        it('should update only storage', async () => {
            const name = uuid();
            const versionsCount = 5;
            const updatedCount = await createAndUpdateCredentials(
                name,
                versionsCount,
                {
                    storage: updatedContent.storage,
                }
            );
            expect(updatedCount).to.eq(versionsCount + 1); // +1 for the initial version
            const latest = await db.dataSources.fetchWithCredentials({ name });
            expect(latest._credentials).to.haveOwnProperty('storage');
            expect(latest._credentials).not.to.haveOwnProperty('git');
            expect(latest._credentials.storage).to.eql(updatedContent.storage);
        });
        it('should update only git', async () => {
            const name = uuid();
            const versionsCount = 5;
            const updatedCount = await createAndUpdateCredentials(
                name,
                versionsCount,
                {
                    git: updatedContent.git,
                }
            );
            expect(updatedCount).to.eq(versionsCount + 1); // +1 for the initial version
            const latest = await db.dataSources.fetchWithCredentials({ name });
            expect(latest._credentials).to.haveOwnProperty('git');
            expect(latest._credentials).not.to.haveOwnProperty('storage');
            expect(latest._credentials.git).to.eql(updatedContent.git);
        });
        it('should fail for no storage or git', async () => {
            const name = uuid();
            const versionsCount = 5;
            let response;
            try {
                response = await createAndUpdateCredentials(
                    name,
                    versionsCount,
                    {
                        irrelevant: true,
                    }
                );
            } catch (error) {
                response = error;
            }
            expect(response.type).to.match(/INVALID_PARAMETERS/);
            expect(response.message).to.match(
                /missing credentials.storage or credentials.git/i
            );
        });
        it('should fail for not found', async () => {
            const name = `non-existing-${uuid()}`;
            let response;
            try {
                await db.dataSources.updateCredentials({
                    name,
                    credentials: { git: { token: 'irrelevant' } },
                });
            } catch (error) {
                response = error;
            }
            expect(response).to.have.ownProperty('metaData');
            expect(response.metaData).to.have.keys(['entityType', 'id']);
            expect(response.metaData.entityType).to.match(/datasource/i);
            expect(response.metaData.id).to.match(/non-existing/i);
        });
    });
});
