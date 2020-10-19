/**
 * @typedef {import('../DataSource').DataSourcesInterface} DataSourcesInterface
 * @typedef {import('../DataSource').DataSource} DataSource
 */

const { stripId } = require('./utils');

/** @implements {DataSourcesInterface} */
class DataSources {
    /** @param {import('mongodb').Collection<DataSource>} collection */
    constructor(collection) {
        this.collection = collection;
    }

    async create(name) {
        const response = await this.collection.insertOne({ name });
        return response.insertedId.toHexString();
    }

    async delete(id) {
        if (!id) {
            throw new Error('you did not provide an id to delete');
        }
        await this.collection.deleteOne({ _id: id });
        return id;
    }

    fetch({ name = '', id = '' } = {}) {
        if (!name && !id) {
            throw new Error('you did not provide a name or id to fetch');
        }
        return (id
            ? this.collection.findOne({ _id: id })
            : this.collection.findOne({ name })
        ).then(stripId);
    }

    fetchAll() {
        return this.collection.find({}).map(stripId).toArray();
    }

    edit() {
        return null;
    }
}

module.exports = DataSources;
