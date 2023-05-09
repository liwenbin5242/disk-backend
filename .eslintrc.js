module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es6': true,
        'node': true
    },
    'extends': 'eslint:recommended',
    'globals': {
        'Atomics': 'readonly',
        'SharedArrayBuffer': 'readonly',
        'before': true,
        'it': true,
        'describe': true,
        'after': true,
    },
    'parserOptions': {
        'ecmaVersion': 2018,
        'sourceType': 'module'
    },
    'rules': {
        'indent': [
            'error',
            4
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'spaced-comment': [// 注释后需要一个空格
            'error',
            'always',
        ],
        'no-multiple-empty-lines': [ // 连续空行最大值
            'error',
            { max: 1 },
        ],
        'no-extra-semi': 'error',
        'linebreak-style': [0, 'error', 'windows'],
        'comma-spacing': ['error', { 'before': false, 'after': true }], // 逗号后强制空格
        'keyword-spacing': ['error', { 'before': true, 'after': true }], // 关键字前后强制空格
        'dot-notation': 'error',    // 强制要求使用点号
        'space-infix-ops': 'error', // 强制操作符前后有空格
        'key-spacing': ['error', { 'afterColon': true }], // 冒号后空格
    },
};