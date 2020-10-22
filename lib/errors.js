const errorTypes = {
    CONFLICT: 'CONFLICT',
};

class Err extends Error {
    /**
     * @param {string} type
     * @param {string} message
     */
    constructor(type, message) {
        super(message);
        this.type = type;
    }
}

module.exports = {
    conflict: (entityType, fieldName) =>
        new Err(
            errorTypes.CONFLICT,
            `could not create ${entityType}, ${fieldName} is already taken`
        ),
    errorTypes,
};
