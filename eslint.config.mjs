import jsPlugin from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import maxParamsPlugin from 'eslint-plugin-max-params-no-constructor'
import tsdocPlugin from 'eslint-plugin-tsdoc'
import typescriptPlugin from 'typescript-eslint'

export default typescriptPlugin.config(
    {
        ignores: ['dist/**/*', 'node_modules/**/*'],
    },
    jsPlugin.configs.recommended,
    typescriptPlugin.configs.recommended,
    {
        plugins: {
            'max-params-no-constructor': maxParamsPlugin,
            tsdoc: tsdocPlugin,
            jsdoc: jsdocPlugin,
        },
    },
    {
        rules: {
            indent: [
                'error',
                4,
                {
                    SwitchCase: 1,
                },
            ],
            'no-trailing-spaces': ['error'],
            'no-multiple-empty-lines': [
                'error',
                {
                    max: 1,
                    maxBOF: 0,
                    maxEOF: 0,
                },
            ],
            'linebreak-style': ['error', 'unix'],
            'eol-last': ['error'],
            quotes: ['error', 'single'],
            semi: ['error', 'never'],
            'max-len': [
                'error',
                {
                    // Having a max line length of 80 might not seem much, but it
                    // allows us to have two files opened side by side, without the
                    // need for horizontal scrolling (e.g. tests on the left,
                    // implementation on the right hand side)
                    code: 80,
                    tabWidth: 4,
                    ignoreComments: false,
                    ignoreUrls: true,

                    // Single-line import statements are allowed to be longer than
                    // 80 characters to improve their readability and to keep them
                    // compact. The {1,64} quantifier ensures that the import lines
                    // don't become too long. At least the "from" keyword should be
                    // within the 80 characters limit.
                    ignorePattern: "^import (.{1,64}) from '(.*)'$",
                },
            ],
            'max-lines-per-function': ['error', 50],
            'max-lines': ['error', 300],
            'max-depth': ['error', 2],
            'max-params-no-constructor/max-params-no-constructor': [
                // This rule ensures that functions and methods won't have more
                // than four parameters. Except class constructors, which might
                // need more parameters for dependency injection.
                //
                // If you need more than four parameters for a function,
                // consider merging some of them to a Props-object. This will
                // increase the readability on the calling side, because the
                // caller needs to explicitly write out each property when
                // creating and passing an object.
                'error',
                4,
            ],
            'max-classes-per-file': ['error', 1],
            complexity: ['error', 7],
            'comma-dangle': ['error', 'always-multiline'],
            'comma-style': ['error', 'last'],
            camelcase: ['error'],
            curly: ['error', 'all'],
            'brace-style': [
                'error',
                '1tbs',
                {
                    allowSingleLine: false,
                },
            ],
            'array-bracket-spacing': ['error', 'never'],
            'arrow-spacing': ['error'],
            'comma-spacing': ['error'],
            'computed-property-spacing': ['error', 'never'],
            'func-call-spacing': ['error', 'never'],
            'key-spacing': ['error'],
            'keyword-spacing': ['error'],
            'object-curly-spacing': ['error', 'always'],
            'space-before-blocks': ['error', 'always'],
            'space-before-function-paren': [
                'error',
                {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always',
                },
            ],
            'space-infix-ops': ['error'],
            'no-multi-spaces': [
                'error',
                {
                    ignoreEOLComments: true,
                },
            ],
            'no-irregular-whitespace': ['error'],
            'no-whitespace-before-property': ['error'],
            'no-duplicate-imports': ['error'],
            'sort-imports': 'off',

            // Enforce documentation comments according to the TSDoc standard
            'tsdoc/syntax': 'error',

            // Enforce documentation comments on all exported items
            //
            // Note that we tried https://github.com/bmarotta-ease/eslint-plugin-require-tsdoc
            // but unfortunately it didn't raise errors on undocumented
            // exported constants. Therefor we have to fall back to this JSDoc
            // plugin, which is kind of unfortunate, because it reports
            // "Missing JSDoc comment" errors, where actually a TSDoc comment
            // is expected.
            //
            // The configuration is inspired by
            // https://github.com/microsoft/tsdoc/issues/209#issuecomment-1579315862
            'jsdoc/require-jsdoc': [
                'error',
                {
                    publicOnly: {
                        cjs: true,
                        esm: true,
                        window: true,
                    },
                    require: {
                        ArrowFunctionExpression: false,
                        ClassDeclaration: true,
                        ClassExpression: false,
                        FunctionDeclaration: false,
                        FunctionExpression: false,
                        MethodDefinition: false,
                    },
                    contexts: [
                        'VariableDeclaration',
                        'TSInterfaceDeclaration',
                        'TSTypeAliasDeclaration',
                        'TSEnumDeclaration',
                    ],
                    enableFixer: false,
                },
            ],

            // Enforce explicit "public" / "private" access modifiers on class
            // methods and fields, except on constructors
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        constructors: 'no-public',
                    },
                },
            ],

            // Enforce all exported constants to be named in UPPER_CASE format
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variable',
                    modifiers: ['const', 'exported'],
                    format: ['UPPER_CASE'],
                },
            ],

            // Enforce all exported constants to be named in UPPER_CASE format
            '@typescript-eslint/no-inferrable-types': [
                'error',
                {
                    ignoreParameters: true,
                    ignoreProperties: true,
                },
            ],

            // Allow unused variables only in `catch (err) { ... }`
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    caughtErrors: 'none',
                },
            ],

            // This rule is more annoying than helpful. Therefor it's disabled:
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        files: ['tests/**/*.spec.ts'],
        rules: {
            'max-lines-per-function': 0,
            'max-lines': 0,
            'max-params-no-constructor/max-params-no-constructor': 0,
        },
    },
    prettierConfig,
    {
        files: ['eslint.config.mjs', 'prettier.config.mjs'],
        rules: {
            // Disable the UPPER_CASE rule for exported consts in config files
            '@typescript-eslint/naming-convention': 'off',
        },
    },
)
