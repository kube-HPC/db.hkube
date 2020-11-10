const errors = require('../errors');
const Collection = require('./Collection');

/**
 * @typedef {import('../DataSource').DataSourcesInterface} DataSourcesInterface
 * @typedef {import('../DataSource').DataSource} DataSource
 * @typedef {import('../DataSource').FileMeta} FileMeta
 */

/**
 * @augments {Collection<DataSource>}
 * @implements {DataSourcesInterface}
 */
class DataSources extends Collection {
    /**
     * @param {object} props
     * @param {string} props.name
     * @param {string} props.version
     * @returns {Promise<DataSource>}
     */
    // @ts-ignore
    async create({ name }) {
        let response;
        /** @type {DataSource} */
        const entry = {
            name,
            versionDescription: 'initial version',
            files: [],
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
                const createdResponse = await this.collection.insertOne(entry);
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
     *     filesAdded?: FileMeta[];
     *     filesDropped?: FileMeta[];
     * }) => Promise<DataSource>}
     */
    async uploadFiles({ name, id, filesAdded = [], filesDropped = [] }) {
        const session = this._client.startSession();
        let response = null;
        try {
            await session.withTransaction(async () => {
                const entry = await this.fetch({ name, id });
                const filesDroppedSet = new Set(
                    filesDropped.map(item => item.name)
                );
                const filesAddedSet = new Set(
                    filesAdded.map(item => item.name)
                );

                const files = entry.files
                    .filter(file => !filesAddedSet.has(file.name))
                    .filter(file => !filesDroppedSet.has(file.name))
                    .concat(filesAdded);
                const updated = await this.collection.findOneAndUpdate(
                    { name },
                    { $set: { files } },
                    { returnOriginal: false }
                );
                // validate the response
                if (updated.ok) {
                    // @ts-ignore
                    const { _id, ...rest } = updated.value;
                    response = { ...rest, id: _id.toHexString() };
                } else {
                    throw errors.internalError;
                }
            });
        } finally {
            session.endSession();
        }
        return response;
    }
}

module.exports = DataSources;
