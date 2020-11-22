require('dotenv').config({ path: './../.env.test' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { openConnections } = require('./connect');
chai.use(chaiAsPromised);

before(async () => {
    // need to clean the test db ?
});

after(async () => {
    await Promise.all(openConnections.map(connection => connection.close()));
});
