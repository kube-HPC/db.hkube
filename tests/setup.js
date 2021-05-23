const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const connect = require('./connect');
chai.use(chaiAsPromised);

before(async () => {
    // need to clean the test db ?
    await connect({}, undefined, { createIndices: true });
});

after(async () => {
    await Promise.all(connect.openConnections.map(connection => connection.close()));
});
