const errors = require('../errors');
const Collection = require('./Collection');
/**
 * @typedef {import('../DataSource').DataSourcesInterface} DataSourcesInterface
 * @typedef {import('../DataSource').DataSource} DataSource
 */

/**
 * @augments {Collection<DataSource>}
 * @implements {DataSourcesInterface}
 */
class DataSources extends Collection {
    init() {
        return this.collection.createIndex({ name: 1 }, { unique: true });
    }

    async create(name) {
        let response;
        try {
            response = await super.create(name);
        } catch (mongoError) {
            switch (mongoError.code) {
                case 11000:
                    throw errors.conflict('dataSources', 'name');
                default:
                    throw mongoError;
            }
        }
        return response;
    }
}

module.exports = DataSources;
