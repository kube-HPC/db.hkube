const MongoDb = require('./lib/MongoDB');
/**
 * @typedef {import('./lib/types').Provider} Provider
 * @typedef {import('./lib/types').Config} Config
 * @typedef {import('./lib/MongoDB').DBInterface} DBInterface
 */

// const providers = {
//     MongoDb,
// };

/** @type {(provider: Provider, config: Config) => DBInterface} */
const DB = (provider = 'MongoDB', config) => {
    const providerConfig = config[provider];
    // const DBProvider = providers[provider];
    return new MongoDb(providerConfig);
    // console.log(DBProvider);
    // const db = new DBProvider(providerConfig);
    // return db;
};

module.exports = DB;
