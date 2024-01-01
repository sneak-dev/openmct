const LEGACY_FILES = ["platform/**", "example/**"];
module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jasmine": true,
        "amd": true
    },
    "globals": {
        "_": "readonly"
    },
    "extends": [
        "eslint:recommended",
        "plugin:vue/recommended"
    ],
    "parser": "vue-eslint-parser",
    "parserOptions": {
        "parser": "babel-eslint",
        "allowImportExportEverywhere": true,
        "ecmaVersion": 2015,
        "ecmaFeatures": {
            "impliedStrict": true
        }
    },
    "rules": {
        "no-bitwise": "error",
        "curly": "error",
        "eqeqeq": "error",
        "guard-for-in": "error",
        "no-extend-native": "error",
        "no-inner-declarations": "off",
        "no-use-before-define": ["error", "nofunc"],
        "no-caller": "error",
        "no-sequences": "error",
        "no-irregular-whitespace": "error",
        "no-new": "error",
        "no-shadow": "error",
        "no-undef": "error",
        "no-unused-vars": [
            "error",
            {
                "vars": "all",
                "args": "none"
            }
        ],
        "no-console": "off",
        "no-trailing-spaces": "error",
        "space-before-function-paren": [
            "error",
            {
                "anonymous": "always",
                "asyncArrow": "always",
                "named": "never",
            }
        ],
        "array-bracket-spacing": "error",
        "space-in-parens": "error",
        "space-before-blocks": "error",
        "comma-dangle": "error",
        "eol-last": "error",
        "new-cap": [
            "error",
            {
                "capIsNew": false,
                "properties": false
            }
        ],
        "dot-notation": "error",
        "indent": ["error", 4],

        // https://eslint.org/docs/rules/no-case-declarations
        "no-case-declarations": "error",
        // https://eslint.org/docs/rules/max-classes-per-file
        "max-classes-per-file": ["error", 1],
        // https://eslint.org/docs/rules/no-eq-null
        "no-eq-null": "error",
        // https://eslint.org/docs/rules/no-eval
        "no-eval": "error",
        // https://eslint.org/docs/rules/no-floating-decimal
        "no-floating-decimal": "error",
        // https://eslint.org/docs/rules/no-implicit-globals
        "no-implicit-globals": "error",
        // https://eslint.org/docs/rules/no-implied-eval
        "no-implied-eval": "error",
        // https://eslint.org/docs/rules/no-lone-blocks
        "no-lone-blocks": "error",
        // https://eslint.org/docs/rules/no-loop-func
        "no-loop-func": "error",
        // https://eslint.org/docs/rules/no-new-func
        "no-new-func": "error",
        // https://eslint.org/docs/rules/no-new-wrappers
        "no-new-wrappers": "error",
        // https://eslint.org/docs/rules/no-octal-escape
        "no-octal-escape": "error",
        // https://eslint.org/docs/rules/no-proto
        "no-proto": "error",
        // https://eslint.org/docs/rules/no-return-await
        "no-return-await": "error",
        // https://eslint.org/docs/rules/no-script-url
        "no-script-url": "error",
        // https://eslint.org/docs/rules/no-self-compare
        "no-self-compare": "error",
        // https://eslint.org/docs/rules/no-sequences
        "no-sequences": "error",
        // https://eslint.org/docs/rules/no-unmodified-loop-condition
        "no-unmodified-loop-condition": "error",
        // https://eslint.org/docs/rules/no-useless-call
        "no-useless-call": "error",
        // https://eslint.org/docs/rules/wrap-iife
        "wrap-iife": "error",
        // https://eslint.org/docs/rules/no-nested-ternary
        "no-nested-ternary": "error",
        // https://eslint.org/docs/rules/switch-colon-spacing
        "switch-colon-spacing": "error",
        // https://eslint.org/docs/rules/no-useless-computed-key
        "no-useless-computed-key": "error",
        // https://eslint.org/docs/rules/rest-spread-spacing
        "rest-spread-spacing": ["error"],

        "vue/html-indent": [
            "error",
            4,
            {
                "attribute": 1,
                "baseIndent": 0,
                "closeBracket": 0,
                "alignAttributesVertically": true,
                "ignores": []
            }
        ],
        "vue/html-self-closing": ["error",
            {
                "html": {
                    "void": "never",
                    "normal": "never",
                    "component": "always"
                },
                "svg": "always",
                "math": "always"
            }
        ],
        "vue/max-attributes-per-line": ["error", {
            "singleline": 1,
            "multiline": {
                "max": 1,
                "allowFirstLine": true
            }
        }],
        "vue/multiline-html-element-content-newline": "off",
        "vue/singleline-html-element-content-newline": "off"
    },
    "overrides": [
        {
            "files": ["*Spec.js"],
            "rules": {
                "no-unused-vars": [
                    "warn",
                    {
                        "vars": "all",
                        "args": "none",
                        "varsIgnorePattern": "controller",

                    }
                ]
            }
        }, {
            "files": LEGACY_FILES,
            "rules": {
                // https://eslint.org/docs/rules/no-nested-ternary
                "no-nested-ternary": "off",
                "no-var": "off"
            }
        }
    ]
};
