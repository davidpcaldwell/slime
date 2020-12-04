namespace slime.web {
	interface Url {
		scheme: string
		userinfo: string
		host: string
		port: number
		path: string
		query: string
		fragment: string
	}

	namespace Url {
		interface Argument {
			scheme?: string
			authority?: {
				host: string
				port: number
				userinfo?: string
			}
			path: string
			query: string | Form.Control[]
			fragment?: string
		}
	}

	interface Context {
		escaper: slime.Codec<string,string>
		window?: Window
	}

	interface Form {
		controls: Form.Control[]
		getUrlencoded: () => string
	}

	namespace Form {
		interface Control {
			name: string
			value: string
		}

		type Argument = Argument.UrlEncoded | Argument.Controls

		namespace Argument {
			interface UrlEncoded {
				urlencoded: string
			}

			interface Controls {
				controls: Control[]
			}
		}
	}

	interface Exports {
		Url: {
			new (argument: Url.Argument): Url
			parse: (string: string) => Url
			query: {
				(array: Form.Control[]): string
				parse: (string: string) => Form.Control[]
			}
		}
		Form: new (p: Form.Argument) => Form
		/**
		 * Provides browser-specific APIs.
		 */
		window?: {
			url: () => Url
			query: {
				controls: () => Form.Control[]
				object: () => { [name: string]: string }
			}
		}
	}
}