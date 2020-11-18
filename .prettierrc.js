module.exports = {
    jsxBracketSameLine: true,
    singleQuote: true,
    trailingComma: 'es5',
    arrowParens: 'avoid',
    tabWidth: 4,
    // printWidth: 180,
    overrides: [
        {
            files: '*.js',
            options: {
                parser: 'jsdoc-parser',
            },
        },
    ],
};
