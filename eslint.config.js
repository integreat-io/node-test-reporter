// import pluginPromise from 'eslint-plugin-promise'
// import pluginSecurity from 'eslint-plugin-security'
// import eslintConfigPrettier from 'eslint-config-prettier'

// eslintConfigPrettier,
// pluginPromise.configs['flat/recommended'],
// pluginSecurity.configs.recommended,

import globals from 'globals'
import pluginJs from '@eslint/js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
]
