const MongoDB = require('./lib/MongoDB');
/**
 * @typedef {import('./lib/types').ProviderName} ProviderName
 * @typedef {import('./lib/types').Config} Config
 * @typedef {import('./lib/Provider').ProviderInterface} ProviderInterface
 */

const providers = {
    MongoDB,
};

/** @type {(provider: ProviderName, config: Config) => ProviderInterface} */
const DB = (provider = 'MongoDB', config) => {
    const providerConfig = config[provider];
    const DBProvider = providers[provider];
    return new DBProvider(providerConfig);
};

module.exports = DB;
