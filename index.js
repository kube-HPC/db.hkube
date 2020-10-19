const MongoDB = require('./lib/MongoDB');
/**
 * @typedef {import('./lib/types').Provider} Provider
 * @typedef {import('./lib/types').Config} Config
 * @typedef {import('./lib/MongoDB')} MongoDB
 */

const providers = {
    MongoDB,
};

/** @type {(provider: Provider, config: Config) => MongoDB} */
const DB = (provider = 'MongoDB', config) => {
    const providerConfig = config[provider];
    const DBProvider = providers[provider];
    return new DBProvider(providerConfig);
};

module.exports = DB;
