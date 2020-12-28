const { ObjectID } = require('mongodb');
const errors = require('../errors');
const Collection = require('./Collection');
const { stripId } = require('./Collection');
const collections = require('./collections');

/**
 * @typedef {import('../DataSource').DataSourcesInterface} DataSourcesInterface
 * @typedef {import('../DataSource').DataSource} DataSource
 * @typedef {import('../DataSource').DataSourceVersion} DataSourceVersion
 * @typedef {import('../DataSource').DataSourceMeta} DataSourceMeta
 * @typedef {import('../DataSource').FileMeta} FileMeta
 * @typedef {import('../DataSource').DataSourceWithMeta} DataSourceWithMeta
 * @typedef {import('./Collection').Collection} Collection
 */

const makeUnique = items => [...new Set(items)];

/**
 * @augments {Collection<DataSource>}
 * @implements {DataSourcesInterface}
 */
class DataSources extends Collection {
    constructor(db, client) {
        super(db, client, collections.DataSources);
    }

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

        await super.transaction(async () => {
            const existingEntry = await super.fetch({ name });
            if (existingEntry !== null) {
                throw errors.conflict('dataSource', 'name');
            }
            response = await super.create(entry, { applyId: true });
        });

        return response;
    }

    /**
     * @param {{
     *     name?: string;
     *     id?: string;
     *     versionId: string;
     *     files: FileMeta[];
     * }} params
     */
    async updateFiles({ name, id, versionId, files }) {
        /** @type {DataSourceWithMeta} */
        let response = null;
        await super.transaction(async () => {
            // also acts as a validation
            const entry = await this.fetch({ name, id });
            const updated = await this.collection.findOneAndUpdate(
                { _id: new ObjectID(entry.id) },
                { $set: { files, versionId, isPartial: false } },
                { returnOriginal: false }
            );
            // validate the response
            if (updated.ok) {
                const { _id, ...rest } = updated.value;
                const totalSize = rest.files.reduce((acc, item) => acc + item.size, 0);
                response = {
                    ...rest,
                    id: _id.toHexString(),
                    fileTypes: makeUnique(rest.files.map(file => file.type)),
                    totalSize,
                    avgFileSize: totalSize / files.length,
                    filesCount: files.length,
                };
            } else {
                throw errors.internalError();
            }
        });

        return response;
    }

    /**
     * @param {{
     *     name?: string;
     *     id?: string;
     *     versionDescription: string;
     * }} params
     */
    async createVersion({ name, id, versionDescription }) {
        /** @type {DataSource} */
        let response = null;
        await super.transaction(async () => {
            const entry = await this.fetch({ id, name });
            const { id: oldId, ...rest } = entry;
            const updatedEntry = { ...rest, versionDescription };
            response = await super.create(
                {
                    ...updatedEntry,
                    isPartial: true,
                },
                { applyId: true }
            );
        });

        return response;
    }

    /** @returns {Promise<DataSourceMeta[]>} */
    async fetchAll() {
        /** @type {DataSourceMeta[]} */
        const collection = await this.collection
            .aggregate([
                { $sort: { _id: -1 } },
                { $match: { isPartial: false } },
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

    /** @type {(query?: { names?: string[]; ids?: string[] }) => Promise<DataSource[]>} */
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
        return super.fetchAll({
            query: {
                name,
                isPartial: false,
            },
            fields: { _id: 1, versionId: 1, versionDescription: 1 },
        });
    }
}

module.exports = DataSources;
