const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');
/** @typedef {import('../lib/DataSource').FileMeta} FileMeta */

/** @type {(amount?: number) => FileMeta[]} */
const generateMockFiles = (amount = 4) =>
    new Array(amount).fill(0).map((file, ii) => ({
        name: `file-${ii}-${uuid.v4()}`,
        path: `path-${ii}`,
        size: 1,
        type: 'csv',
    }));

describe('dataSource', () => {
    it('should throw conflict error when name already exists', async () => {
        const db = await connect();
        const name = uuid.v4();
        const firstResponse = await db.dataSources.create({ name });
        expect(firstResponse).to.be.string;
        const promise = db.dataSources.create({ name });
        await expect(promise).to.be.rejectedWith(
            'could not create dataSource, name is already taken'
        );
    });
    it('should create and fetch and delete a datasource by id', async () => {
        const db = await connect();
        const name = uuid.v4();
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
        const deletedId = await db.dataSources.delete({ id: insertedId });
        expect(deletedId).to.eq(insertedId);
    });
    it('should create and fetch and delete a datasource by name', async () => {
        const db = await connect();
        const name = uuid.v4();
        await db.dataSources.create({ name });
        const dataSource = await db.dataSources.fetch({ name });
        expect(dataSource.name).to.equal(name);
        expect(dataSource.id).to.be.string;
        const fetchedByName = await db.dataSources.fetch({ name });
        expect(fetchedByName).to.eql(dataSource);
        const deletedName = await db.dataSources.delete({ name });
        expect(deletedName).to.eq(name);
    });
    it('should upload a list of files', async () => {
        const db = await connect();
        const name = uuid.v4();
        const created = await db.dataSources.create({ name });
        /** @type {FileMeta[]} */
        const filesAdded = generateMockFiles();
        const uploadResponse = await db.dataSources.uploadFiles({
            name,
            filesAdded,
        });
        expect(uploadResponse.files).to.have.lengthOf(4);
        expect(uploadResponse.files).to.eql(filesAdded);
        expect(uploadResponse.id).to.eq(created.id);
    });
    it('should upload 2 files, update 1, add 1 more and delete 1', async () => {
        const db = await connect();
        const name = uuid.v4();
        await db.dataSources.create({ name });

        const filesAdded = generateMockFiles(3);
        const [fileToDrop, fileToModify, fileToKeep] = filesAdded;
        /** @type {FileMeta} */
        const updatedFile = { ...fileToModify, path: 'new path' };
        const newFile = generateMockFiles(1)[0];

        await db.dataSources.uploadFiles({
            name,
            filesAdded,
        });

        const response = await db.dataSources.uploadFiles({
            name,
            filesAdded: [updatedFile, newFile],
            filesDropped: [fileToDrop],
        });
        const { files } = response;
        expect(files).to.have.lengthOf(3);
        expect(files).to.deep.include(fileToKeep);
        expect(files).to.deep.include(updatedFile);
        expect(files).to.deep.include(newFile);
        expect(files).not.to.deep.include(fileToDrop);
    });
});
