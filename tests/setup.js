const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const connect = require('../index');
chai.use(chaiAsPromised);

const config = {
    mongo: {
        auth: {
            user: process.env.DB_USER_NAME,
            password: process.env.DB_PASSWORD,
        },
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        dbName: process.env.DB_NAME,
    },
}

before(async () => {
    const db = connect(config);
    await db.init();
    await db.db.dropDatabase();
    await db.init({ createIndices: true });
    global.testParams = {
        db
    }
});


