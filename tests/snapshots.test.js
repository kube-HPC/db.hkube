const { ObjectId } = require('mongodb');
const { expect } = require('chai');
const uuid = require('uuid').v4;
const connect = require('./connect');
const { generateMockFiles } = require('./utils');

/** @type {import('../lib/Provider').ProviderInterface} */
let db = null;

describe('DataSources', () => {
    before(async () => {
        db = await connect();
    });
    it('should fail creating multiple snapshots with the same name on the same dataSource', async () => {
        const name = uuid();
        const snapshotName = uuid();
        const dataSource = await db.dataSources.create({
            name,
            git: null,
            storage: null,
        });
        await db.snapshots.create({
            name: snapshotName,
            dataSource: { name, id: dataSource.id },
            filteredFilesList: [],
            droppedFiles: [],
            query: 'irrelevant',
        });
        let didThrow = false;
        try {
            await db.snapshots.create({
                name: snapshotName,
                dataSource: { name, id: dataSource.id },
                filteredFilesList: [],
                droppedFiles: [],
                query: 'irrelevant',
            });
        } catch (error) {
            didThrow = true;
            expect(error.type).to.eq('CONFLICT');
        }
        expect(didThrow).to.be.true;
    });
    it('should succeed creating a snapshot with the same name on different datSources', async () => {
        const name_a = uuid();
        const name_b = uuid();
        const snapshotName = uuid();
        const dataSource_a = await db.dataSources.create({
            name: name_a,
            git: null,
            storage: null,
        });
        const dataSource_b = await db.dataSources.create({
            name: name_b,
            git: null,
            storage: null,
        });
        let createdBoth = false;
        await db.snapshots.create({
            dataSource: { name: dataSource_a.name, id: dataSource_a.id },
            name: snapshotName,
            query: '',
            droppedFiles: [],
            filteredFilesList: [],
        });
        await db.snapshots.create({
            dataSource: { name: dataSource_b.name, id: dataSource_b.id },
            name: snapshotName,
            query: '',
            droppedFiles: [],
            filteredFilesList: [],
        });
        createdBoth = true;
        expect(createdBoth).to.be.true;
    });

    describe('fetch dataSource', () => {
        it('should fetch dataSource by snapshot', async () => {
            const name = uuid();
            const { _credentials, ...dataSource } = await db.dataSources.create(
                {
                    name,
                    git: null,
                    storage: null,
                }
            );
            const snapshot = await db.snapshots.create(
                {
                    name,
                    query: 'something',
                    dataSource: {
                        name: dataSource.name,
                        id: dataSource.id,
                    },
                },
                { applyId: true }
            );
            const resolvedDataSource = await db.snapshots.fetchDataSource({
                snapshotName: snapshot.name,
                dataSourceName: snapshot.dataSource.name,
            });
            expect(resolvedDataSource).to.have.all.keys(
                'name',
                'query',
                'id',
                'dataSource'
            );
            expect(resolvedDataSource.dataSource).to.eql(dataSource);
        });
        it('should return null for non matching datasource', async () => {
            const resolvedDataSource = await db.snapshots.fetchDataSource({
                snapshotName: 'non-existing',
                dataSourceName: 'irrelevant',
            });
            expect(resolvedDataSource).to.be.null;
        });
    });
    it('should update the files list', async () => {
        const name = uuid();
        const snapshot = await db.snapshots.create(
            {
                name,
                query: 'something',
                dataSource: {
                    name: 'some-name',
                    id: 'some-id',
                },
            },
            { applyId: true }
        );
        const droppedFiles = generateMockFiles();
        const filesList = generateMockFiles();
        const extendedSnapshot = await db.snapshots.updateFilesList({
            id: snapshot.id,
            filesList,
            droppedFiles,
        });
        expect(extendedSnapshot).to.be.true;
    });
    it('should not update non existing snapshot', async () => {
        const extendedSnapshot = await db.snapshots.updateFilesList({
            id: new ObjectId(),
            filesList: [],
            droppedFiles: [],
        });
        expect(extendedSnapshot).to.be.false;
    });
});
