//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.snippets {
	interface Language {
		json: Snippet[]
		vscode: vscode.Snippet[]
	}

	/**
	 * Snippet syntax: [TextMate](https://macromates.com/manual/en/snippets) minus interpolated shell code and
	 * \u; see [Snippets in Visual Studio Code](https://code.visualstudio.com/docs/editor/userdefinedsnippets).
	 */
	export namespace vscode {
		export interface Snippet {
			name: string
			prefix: string
			body: string[]
			description: string
		}
	}

	export interface ApiHtmlSnippet {
		name: string
		abbreviation: string
		html: string
	}

	interface Snippet {
		name: string
		code: string
	}
}