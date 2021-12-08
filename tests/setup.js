const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const connect = require('./connect');
chai.use(chaiAsPromised);

before(async () => {
    const db = await connect();
    await db.db.dropDatabase();
    await db.init({ createIndices: true });
    global.testParams = {
        db
    }
});


