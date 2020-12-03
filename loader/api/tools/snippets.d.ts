namespace slime.tools.snippets {
	interface Language {
		json: Snippet[]
		vscode: vscode.Snippet[]
	}

	namespace vscode {
		interface Snippet {
			name: string
			prefix: string
			body: string[]
			description: string
		}
	}

	interface ApiHtmlSnippet {
		name: string
		abbreviation: string
		html: string
	}

	interface Snippet {
		name: string
		code: string
	}
}