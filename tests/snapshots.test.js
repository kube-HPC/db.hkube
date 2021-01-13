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
    describe('fetch dataSource', () => {
        it('should fetch dataSource by snapshot', async () => {
            const name = uuid();
            const dataSource = await db.dataSources.create({ name });
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
            expect(resolvedDataSource).to.have.all.keys('name', 'query', 'id', 'dataSource');
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
