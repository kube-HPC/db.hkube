const { ObjectID } = require('mongodb');
const errors = require('../errors');
const Collection = require('./Collection');
const { stripId } = require('./Collection');

/**
 * @typedef {import('../DataSource').DataSourcesInterface} DataSourcesInterface
 * @typedef {import('../DataSource').DataSource} DataSource
 * @typedef {import('../DataSource').DataSourceVersion} DataSourceVersion
 * @typedef {import('../DataSource').DataSourceMeta} DataSourceMeta
 * @typedef {import('../DataSource').FileMeta} FileMeta
 * @typedef {import('../DataSource').DataSourceWithMeta} DataSourceWithMeta
 */

const makeUnique = items => [...new Set(items)];

/**
 * @augments {Collection<DataSource>}
 * @implements {DataSourcesInterface}
 */
class DataSources extends Collection {
    /** @type {(props: { name: string }) => Promise<DataSource>} */
    async create({ name }) {
        let response;
        /** @type {DataSource} */
        const entry = {
            name,
            versionDescription: 'initial version',
            files: [],
            versionId: '',
            isPartial: true,
        };

        const session = this._client.startSession();
        try {
            await session.withTransaction(async () => {
                // manually validate the datasource name is available
                // it cannot be done using a unique index because different versions hold the same name
                const existingEntry = await this.collection.findOne({ name });
                if (existingEntry !== null) {
                    throw errors.conflict('dataSource', 'name');
                }
                const createdResponse = await this.collection.insertOne({
                    ...entry,
                });
                response = {
                    ...entry,
                    id: createdResponse.insertedId.toHexString(),
                };
            });
        } finally {
            session.endSession();
        }
        return response;
    }

    /**
     * @type {(params: {
     *     name?: string;
     *     id?: string;
     *     versionId: string;
     *     files: { droppedIds?: string[]; mapping?: FileMeta[] };
     * }) => Promise<DataSourceWithMeta>}
     */
    async uploadFiles({
        name,
        id,
        versionId,
        files: { droppedIds = [], mapping = [] },
    }) {
        const session = this._client.startSession();
        let response = null;
        try {
            await session.withTransaction(async () => {
                // also acts as a validation
                const entry = await this.fetch({ name, id });
                const filesDroppedSet = new Set(droppedIds);
                const filesTouched = new Set(mapping.map(item => item.id));

                const files = entry.files
                    .filter(
                        file =>
                            !(
                                filesDroppedSet.has(file.id) ||
                                filesTouched.has(file.id)
                            )
                    )
                    .concat(mapping);

                const updated = await this.collection.findOneAndUpdate(
                    { _id: new ObjectID(entry.id) },
                    { $set: { files, versionId, isPartial: false } },
                    { returnOriginal: false }
                );
                // validate the response
                if (updated.ok) {
                    const { _id, ...rest } = updated.value;
                    const totalSize = rest.files.reduce(
                        (acc, item) => acc + item.size,
                        0
                    );
                    response = {
                        ...rest,
                        id: _id.toHexString(),
                        fileTypes: makeUnique(
                            rest.files.map(file => file.type)
                        ),
                        totalSize,
                        avgFileSize: totalSize / files.length,
                        filesCount: files.length,
                    };
                } else {
                    throw errors.internalError();
                }
            });
        } finally {
            session.endSession();
        }
        return response;
    }

    /**
     * @type {(params: {
     *     name?: string;
     *     id?: string;
     *     versionDescription: string;
     * }) => Promise<DataSource>}
     */
    async createVersion({ name, id, versionDescription }) {
        const session = this._client.startSession();
        let response = null;
        try {
            await session.withTransaction(async () => {
                const entry = await this.fetch({ id, name });
                const { id: oldId, ...rest } = entry;
                const updatedEntry = { ...rest, versionDescription };
                const insertResponse = await this.collection.insertOne({
                    // destructuring because mongo's driver mutates the object and adds _id
                    ...updatedEntry,
                    isPartial: true,
                });
                response = {
                    ...updatedEntry,
                    id: insertResponse.insertedId.toHexString(),
                };
            });
        } finally {
            session.endSession();
        }
        return response;
    }

    /** @returns {Promise<DataSourceMeta[]>} */
    async fetchAll() {
        /** @type {DataSourceMeta[]} */
        const collection = await this.collection
            .aggregate([
                { $sort: { _id: -1 } },
                {
                    $group: {
                        _id: { name: '$name' },
                        versionDescription: { $first: '$versionDescription' },
                        id: { $first: '$_id' },
                        files: { $first: '$files' },
                    },
                },
                {
                    $project: {
                        _id: '$id',
                        name: '$_id.name',
                        versionDescription: 1,
                        filesCount: { $size: '$files' },
                        avgFileSize: { $avg: '$files.size' },
                        totalSize: { $sum: '$files.size' },
                        fileTypes: '$files.type',
                    },
                },
            ])
            .toArray();
        return collection
            .map(ds => ({ ...ds, fileTypes: makeUnique(ds.fileTypes) }))
            .map(this[stripId]);
    }

    /**
     * @type {(query?: {
     *     names?: string[];
     *     ids?: string[];
     * }) => Promise<DataSource[]>}
     */
    async fetchMany({ names = [], ids = [] } = {}) {
        if (names.length === 0 && ids.length === 0) {
            throw errors.missingParam('names | ids');
        }
        /** @type {DataSource[]} */
        let collection = [];
        if (names.length > 0) {
            const additive = await this.collection
                .aggregate([
                    { $match: { name: { $in: names } } },
                    { $sort: { _id: -1 } },
                    {
                        $group: {
                            _id: { name: '$name' },
                            versionDescription: {
                                $first: '$versionDescription',
                            },
                            id: { $first: '$_id' },
                            files: { $first: '$files' },
                        },
                    },
                    {
                        $project: {
                            _id: '$id',
                            name: '$_id.name',
                            versionDescription: 1,
                            files: '$files',
                        },
                    },
                ])
                .toArray();
            collection = collection.concat(additive.map(this[stripId]));
        }

        if (ids.length > 0) {
            const additive = await this.collection
                .find({ _id: { $in: ids.map(id => new ObjectID(id)) } })
                .toArray();
            collection = collection.concat(additive.map(this[stripId]));
        }
        return collection;
    }

    /** @type {({ name: string }) => Promise<DataSourceVersion[]>} */
    async listVersions({ name }) {
        const collection = await this.collection
            .find({ name })
            .project({ _id: 1, versionId: 1, versionDescription: 1 })
            .toArray();
        return collection.map(this[stripId]);
    }
}

module.exports = DataSources;
