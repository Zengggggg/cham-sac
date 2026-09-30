module.exports = {
  env: { es2020: true, node: true },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [],
  rules: {
    'no-console': 'off',
    'no-extra-boolean-cast': 'off',
    'no-lonely-if': 'warn',
    'no-unused-vars': 'warn',
    'no-trailing-spaces': 'warn',
    'no-multi-spaces': 'warn',
    'no-multiple-empty-lines': 'warn',
    'space-before-blocks': ['warn', 'always'],
    'object-curly-spacing': [1, 'always'],
    // 'indent': ['warn', ],
    'semi': ['warn', 'off'],
    // 'quotes': ['warn', 'single'],
    'array-bracket-spacing': 1,
    'linebreak-style': 0,
    'no-unexpected-multiline': 'warn',
    'keyword-spacing': 1,
    'comma-dangle': 1,
    'comma-spacing': 1,
    'arrow-spacing': 1
  }
}