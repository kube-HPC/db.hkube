const { ObjectId } = require('mongodb');
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
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);
        this.fetch = this.fetch.bind(this);
        this.fetchAll = this.fetchAll.bind(this);
    }

    async create(name) {
        const response = await this.collection.insertOne({ name });
        return response.insertedId.toHexString();
    }

    async delete(id) {
        if (!id) {
            throw new Error('you did not provide an id to delete');
        }
        const response = await this.collection.deleteOne({
            _id: new ObjectId(id),
        });
        return response.deletedCount > 0 ? id : null;
    }

    async fetch({ name = '', id = '' } = {}) {
        if (!name && !id) {
            throw new Error('you did not provide a name or id to fetch');
        }
        const entry = await (id
            ? this.collection.findOne({ _id: new ObjectId(id) })
            : this.collection.findOne({ name }));
        return stripId(entry);
    }

    fetchAll() {
        return this.collection.find({}).map(stripId).toArray();
    }
}

module.exports = DataSources;
