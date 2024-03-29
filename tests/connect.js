const DBConnection = require('./../');
/**
 * @typedef {import('../lib/MongoDB').ProviderInterface} ProviderInterface
 * @typedef {import('mongodb').MongoClientOptions} MongoClientOptions
 */

/** @type {ProviderInterface[]} */
const openConnections = [];

/** @param {MongoClientOptions} config */
const connect = async (config = {}, provider = undefined, createIndices = false) => {
    /** @type {ProviderInterface} */

    const db = DBConnection(
        {
            mongo: {
                auth: {
                    user: config.user || process.env.DB_USER_NAME,
                    password: config.password || process.env.DB_PASSWORD,
                },
                host: config.host || process.env.DB_HOST,
                port: config.port || parseInt(process.env.DB_PORT, 10),
                connectionMethod: config.connectionMethod || process.env.MONGODB_CONNECTION_METHOD,
                tls: config.tls || "false",
                dbName: process.env.DB_NAME,
                ...config,
            },
        },
        provider
    );
    await db.init({ createIndices });
    openConnections.push(db);
    return db;
};

module.exports = connect;
module.exports.openConnections = openConnections;
