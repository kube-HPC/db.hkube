const stripId = entry => {
    const { _id, ...rest } = entry;
    return { ...rest, id: _id };
};

const _projection = (array, bool) => {
    if (Array.isArray(array) && array.length > 0) {
        return array.reduce((acc, cur) => {
            acc[cur] = bool;
            return acc;
        }, {});
    }
    return array;
};

const sortMap = sortObj => {
    if (!sortObj) {
        return null;
    }
    return Object.entries(sortObj).reduce((acc, [prop, sort]) => {
        acc[prop] = sort === 'asc' ? 1 : -1;
        return acc;
    }, {});
};

const createProjection = (included = [], excluded = [], excludeId) => {
    if (included.length > 0 && excluded.length > 0) {
        // we can throw an error or pick only one
        throw new Error('inclusion cannot be mixed with exclusion');
    }
    const excludedId = excludeId ? ['_id'] : [];
    const excludeArray = [...excludedId, ...excluded];
    const includedObj = _projection(included, 1);
    const excludedObj = _projection(excludeArray, 0);
    return { ...includedObj, ...excludedObj };
};

module.exports = {
    stripId,
    createProjection,
    sortMap,
};
