const errorTypes = {
    CONFLICT: 'CONFLICT',
    INVALID_ID: 'INVALID_ID',
    MISSING_PARAMETER: 'MISSING_PARAMETER',
    INVALID_PARAMETERS: 'INVALID_PARAMETERS',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND',
};

class DBError extends Error {
    /**
     * @param {string} type
     * @param {string} message
     * @param {{ id?: string; entityType?: string }} metaData
     */
    constructor(type, message, metaData = {}) {
        super(message);
        this.type = type;
        this.metaData = metaData;
    }

    static isDBError(e) {
        return e instanceof DBError;
    }
}

module.exports = {
    itemNotFound: (entityType, id) =>
        new DBError(
            errorTypes.NOT_FOUND,
            `could not find ${entityType}:${id}`,
            {
                entityType,
                id,
            }
        ),
    invalidParams: message =>
        new DBError(errorTypes.INVALID_PARAMETERS, message),
    missingParam: parameter =>
        new DBError(
            errorTypes.MISSING_PARAMETER,
            `you did not provide ${parameter}`
        ),
    conflict: (entityType, fieldName) =>
        new DBError(
            errorTypes.CONFLICT,
            `could not create ${entityType}, ${fieldName} is already taken`,
            { entityType, fieldName }
        ),
    invalidId: id =>
        new DBError(errorTypes.INVALID_ID, `you provided an invalid id ${id}`),
    internalError: () =>
        new DBError(errorTypes.INTERNAL_ERROR, 'internal error'),
    errorTypes,
    isDBError: DBError.isDBError,
};
