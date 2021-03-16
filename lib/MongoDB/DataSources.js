const { ObjectId } = require('mongodb');
const { itemNotFound, invalidParams } = require('../errors');
const errors = require('../errors');
const Collection = require('./Collection');
const { stripId } = require('./Collection');
const collections = require('./collections');

/**
 * @typedef {import('../DataSource').DataSourcesCollection} DataSourcesCollection
 * @typedef {import('../DataSource').DataSource} DataSource
 * @typedef {import('../DataSource').GitConfig} GitConfig
 * @typedef {import('../DataSource').Credentials} Credentials
 * @typedef {import('../DataSource').StorageConfig} StorageConfig
 * @typedef {import('../DataSource').DataSourceVersion} DataSourceVersion
 * @typedef {import('../DataSource').DataSourceMeta} DataSourceMeta
 * @typedef {import('../DataSource').FileMeta} FileMeta
 * @typedef {import('../DataSource').DataSourceWithMeta} DataSourceWithMeta
 * @typedef {import('../DataSource').DataSourceWithCredentials} DataSourceWithCredentials
 */

const makeUnique = items => [...new Set(items)];

/**
 * @augments {Collection<DataSource>}
 * @implements {DataSourcesCollection}
 */
class DataSources extends Collection {
    constructor(db, client) {
        super(db, client, collections.DataSources);
    }

    /**
     * @type {(props: {
     *     name: string;
     *     git: GitConfig;
     *     storage: StorageConfig;
     *     credentials?: Credentials;
     * }) => Promise<DataSource>}
     */
    create({ name, git, storage, credentials = {} }) {
        const entry = {
            name,
            git,
            storage,
            _credentials: credentials,
            versionDescription: 'initial version',
            files: [],
            commitHash: '',
            isPartial: true,
        };

        return this.transaction(async () => {
            const existingEntry = await this.fetchWithCredentials(
                { name },
                { allowNotFound: true }
            );
            if (existingEntry !== null) {
                throw errors.conflict('dataSource', 'name');
            }
            // @ts-ignore
            const { _credentials, ...doc } = await super.create(entry, {
                applyId: true,
            });
            return doc;
        });
    }

    async fetch(query, { allowNotFound = false, ...props } = {}) {
        const entry = await super.fetch(query, {
            allowNotFound,
            ...props,
            fields: {
                // @ts-ignore
                ...props.fields,
            },
        });
        if (!entry) return entry;
        // @ts-ignore
        const { _credentials, ...rest } = entry;
        return rest;
    }

    /** @returns {Promise<DataSourceWithCredentials>} */
    // @ts-ignore
    fetchWithCredentials(query, { allowNotFound = false, ...props } = {}) {
        // @ts-ignore
        return super.fetch(query, {
            allowNotFound,
            ...props,
        });
    }

    async setRepositoryUrl({ name }, { url }) {
        const update = await this.collection.updateOne(
            { name },
            { $set: { repositoryUrl: url } }
        );
        if (update.modifiedCount !== 1) {
            throw itemNotFound('datasource', name);
        }
        return null;
    }

    delete({ id, name }, { allowNotFound = false, ...props } = {}) {
        if (id) return super.delete({ id }, { allowNotFound, ...props });
        return this.deleteMany({ name }, { allowNotFound, ...props });
    }

    /**
     * @param {{
     *     name?: string;
     *     id?: string;
     *     commitHash: string;
     *     files: FileMeta[];
     * }} params
     * @returns {Promise<DataSourceWithMeta>}
     */
    updateFiles({ name, id, commitHash, files }) {
        return this.transaction(async () => {
            // also acts as a validation
            const entry = await this.fetch({ name, id });
            const updated = await this.collection.findOneAndUpdate(
                { _id: new ObjectId(entry?.id) },
                { $set: { files, commitHash, isPartial: false } },
                {
                    returnOriginal: false,
                    projection: { isPartial: 0, _credentials: 0 },
                }
            );
            // validate the response
            if (updated.ok) {
                // @ts-ignore
                const { _id, ...rest } = updated.value;
                const totalSize = rest.files.reduce(
                    (acc, item) => acc + item.size,
                    0
                );
                return {
                    ...rest,
                    id: _id.toHexString(),
                    fileTypes: makeUnique(rest.files.map(file => file.type)),
                    totalSize,
                    avgFileSize: totalSize / files.length,
                    filesCount: files.length,
                };
            }
            throw errors.internalError();
        });
    }

    /**
     * @param {{
     *     name?: string;
     *     id?: string;
     *     versionDescription: string;
     * }} params
     * @returns {Promise<DataSourceWithCredentials>}
     */
    createVersion({ name, id, versionDescription }) {
        return this.transaction(async () => {
            const entry = await this.fetchWithCredentials({ id, name });
            const { id: oldId, ...rest } = entry;
            const updatedEntry = { ...rest, versionDescription };
            return super.create(
                {
                    ...updatedEntry,
                    isPartial: true,
                },
                { applyId: true }
            );
        });
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
                .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
                .toArray();
            collection = collection.concat(additive.map(this[stripId]));
        }
        return collection;
    }

    /**
     * Lists all the latest non partial versions of all the datasources
     *
     * @returns {Promise<DataSourceMeta[]>}
     */
    async listDataSources() {
        /** @type {DataSourceMeta[]} */
        // @ts-ignore
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

    /**
     * Lists all the versions for a given datasource, ignores partial versions
     *
     * @type {({ name: string }) => Promise<DataSourceVersion[]>}
     */
    async listVersions({ name }) {
        // @ts-expect-error
        return super.fetchAll({
            query: {
                name,
                isPartial: false,
            },
            fields: {
                commitHash: 1,
                versionDescription: 1,
            },
        });
    }

    /**
     * Override credentials for git, storage or both. updates are performed by
     * dataSource name and apply to all versions.
     *
     * @param {{ name: string; credentials: Credentials; allowNotFound?: boolean }} props
     */
    async updateCredentials({ name, credentials, allowNotFound = false }) {
        let updateObject;
        if (credentials.git && credentials.storage) {
            updateObject = { _credentials: credentials };
        } else if (credentials.git) {
            updateObject = { '_credentials.git': credentials.git };
        } else if (credentials.storage) {
            updateObject = { '_credentials.storage': credentials.storage };
        } else {
            throw invalidParams(
                'missing credentials.storage or credentials.git'
            );
        }
        const response = await this.collection.updateMany(
            { name },
            { $set: updateObject }
        );
        const { modifiedCount } = response;
        if (modifiedCount > 0) return modifiedCount;
        if (allowNotFound) return modifiedCount;
        throw itemNotFound('dataSource', name);
    }
}

module.exports = DataSources;
