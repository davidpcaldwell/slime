//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

import js from "@eslint/js";

export default [
	{
		ignores: ["local/*", "eslint.config.js"]
	},
	js.configs.recommended,
	{
		name: "slime",
		//	files
		//	ignores
		languageOptions: {
			//	TODO	revisit, should probably be directory-specific
			ecmaVersion: 2022,
			sourceType: "script"
		},
		rules: {
			"no-mixed-spaces-and-tabs": "error",
			"no-shadow-restricted-names": "error",
			"no-ex-assign": "error",
			"no-prototype-builtins": "error",
			"no-extra-semi": "error",
			"getter-return": "error",
			"quotes": ["error", "double"],

			//	Implicit globals are very confusing for TypeScript
			"no-implicit-globals": "warn",
			//	Possibly should be allowed, at least for unused parameters?
			"no-unused-vars": ["warn", { "args": "none" }],
			"no-redeclare": "warn",
			"no-debugger": "warn",
			"indent": ["warn", "tab", { "SwitchCase": 1 }],
			"no-empty": "warn",
			"no-cond-assign": "warn",

			//	things like if (false), used often to disable code while retaining syntax highlighting, etc.
			"no-constant-condition": "off",

			//	disallows references to undefined variables; currently would break everything with $context/$exports/$loader, so turning
			//	off
			"no-undef": "off",

			//	Restricts comparison of typeof(x) to other typeofs or correct string literals (and optionally other variables).
			//	Would break E4X-aware code, so leaving off
			"valid-typeof": "off",

			//	Disallows 'with' statements, currently used by loader
			"no-with": "off",

			//	Below are recommended options needing evaluation, possibly by flagging all instances and examining to see why they're
			//	being broken

			//	Disallows escape sequences in strings, RegExp, template literals
			"no-useless-escape": "off",

			//	Disallows unreachable code
			"no-unreachable": "off",

			//	Disallows cast to Boolean in if / while / do-while / for
			"no-extra-boolean-cast": "off",

			//	Disallows assigning value to itself
			"no-self-assign": "off",

			//	Disallows assigning global variables
			"no-global-assign": "off",

			//	TODO	why is this needed?
			//	VSCode error with latest eslint complaining about the definition for the below rule not being found, so disabling it
			//	for now, since we are not using the optional chain operator anyway (it is not supported by several supported runtimes).
			"no-unsafe-optional-chaining": "off",

			"no-constant-binary-expression": "off"
		}
	},
	{
		name: "node",
		files: ["**/*.node.js"],
		languageOptions: {
			ecmaVersion: 2017,
			sourceType: "module"
		}
	}
]
