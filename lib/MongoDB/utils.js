const sortOrderMap = {
    asc: 1,
    desc: -1,
    text: 'text',
};

const _fieldsMapper = (fields, fn) => {
    return Object.entries(fields).reduce((acc, [k, v]) => {
        acc[k] = fn(v);
        return acc;
    }, {});
};

const createProjection = (fields, excludeId) => {
    const projectFields = _fieldsMapper(fields, v => (v === true ? 1 : 0));
    const projection = excludeId ? { ...projectFields, _id: 0 } : projectFields;
    return projection;
};

const createSortOrder = fields => {
    if (!fields) {
        return null;
    }
    return _fieldsMapper(fields, v => sortOrderMap[v] || 1);
};

module.exports = {
    createProjection,
    createSortOrder,
};
