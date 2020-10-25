const { expect } = require('chai');
const { isDBError, invalidId } = require('./../lib/errors');

describe('errors', () => {
    it('should identify the error as DBError instance', () => {
        expect(isDBError(invalidId(''))).to.be.true;
    });
    it('should not validate non DBError instance', () => {
        expect(isDBError(new Error())).to.be.false;
    });
});
