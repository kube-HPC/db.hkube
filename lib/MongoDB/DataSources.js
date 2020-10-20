const Collection = require('./Collection');
/**
 * @typedef {import('../DataSource').DataSourcesInterface} DataSourcesInterface
 * @typedef {import('../DataSource').DataSource} DataSource
 */

/**
 * @augments {Collection<DataSource>}
 * @implements {DataSourcesInterface}
 */
class DataSources extends Collection {}

module.exports = DataSources;
