const MongoDB = require('./lib/MongoDB');
/**
 * @typedef {import('./lib/MongoDB/types.d').ProviderName} ProviderName
 * @typedef {import('./lib/MongoDB/types.d').Config} Config
 * @typedef {import('./lib/MongoDB/Provider').ProviderInterface} ProviderInterface
 */

const providers = {
    mongo: MongoDB,
};

/** @type {(config: Config, provider?: ProviderName) => ProviderInterface} */
const DBConnection = (config, provider = 'mongo') => {
    const DBProvider = providers[provider];
    if (!DBProvider) {
        throw new Error(
            `invalid provider name, ${provider}, available options are ${Object.keys(
                providers
            ).join(', ')}`
        );
    }
    const providerConfig = config[provider];
    if (!providerConfig) {
        throw new Error(`invalid config for provider ${provider}`);
    }
    // @ts-ignore
    return new DBProvider(providerConfig);
};

module.exports = DBConnection;
