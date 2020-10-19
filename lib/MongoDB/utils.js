module.exports.stripId = entry => {
    const { _id, ...rest } = entry;
    return { ...rest, id: _id };
};
