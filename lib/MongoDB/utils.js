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
    return null;
};

const includedMap = array => {
    return _projection(array, 1);
};

const excludedMap = array => {
    return _projection(array, 0);
};

module.exports = {
    stripId,
    includedMap,
    excludedMap,
};
