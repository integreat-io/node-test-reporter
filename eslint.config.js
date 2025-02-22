import pluginPrettier from 'eslint-config-prettier'
import pluginPromise from 'eslint-plugin-promise'

import globals from 'globals'
import pluginJs from '@eslint/js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  pluginPrettier,
  pluginPromise.configs['flat/recommended'],
]
