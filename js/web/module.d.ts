namespace slime.web {
	interface Context {
		/**
		 * An object capable of handling the [percent-encoding](http://tools.ietf.org/html/rfc3986#section-2.1)
		 * (or "URL-encoding") algorithm.
		 */
		escaper: slime.Codec<string,string>
		window?: Window
	}

	interface Exports {
		Url: {
			/**
			 * See [RFC 3986](http://tools.ietf.org/html/rfc3986).
			 */
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