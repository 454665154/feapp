module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module'
    },
    // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
    extends: 'defaults',
    // required to lint *.vue files
    plugins: [
        'html'
    ],
    // add your custom rules here
    'rules': {
        // allow paren-less arrow functions
        'arrow-parens': 0,
        // allow async-await
        'generator-star-spacing': 0,
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        // 行尾分号
        'semi': ['error', 'always'],
        // 允许出现未使用过的变量
        "no-unused-vars": [0, { "vars": "all", "args": "none" }],
        // 允许未声明的变量
        "no-undef": 0,
        // 使用 === 替代 == allow-null允许null和undefined==s
        // "eqeqeq": [2, "allow-null"]
    }
};
