require('dotenv').config({ path: './../.env.test' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
