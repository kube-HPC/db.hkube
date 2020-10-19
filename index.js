const MongoDb = require('./lib/MongoDB');
/**
 * @typedef {import('./lib/types').Provider} Provider
 * @typedef {import('./lib/types').Config} Config
 */

const providers = {
    MongoDb,
};

/**
 * @param {Provider} provider
 * @param {Config} config
 */
const DB = (provider = 'MongoDB', config) => {
    const providerConfig = config[provider];
    const DBProvider = providers[provider];
    const db = new DBProvider(providerConfig);
    return db;
};

module.exports = DB;
