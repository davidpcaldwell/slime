namespace slime.browser {
	export interface Settings {
		debug?: (message: string) => void
		XMLHttpRequest?: typeof XMLHttpRequest
		url?: any
		callback?: () => void
		script?: any
		base?: any
		$slime?: {
			flags?: any
		}
	}

	export interface Context {
		location: Location

		XMLHttpRequest: typeof XMLHttpRequest
		inonit: Exports
		CoffeeScript: any
	}

	export interface Exports {
		loader: {
			run: any
			file: any
			module: any
			value: any
			get: any
			Loader: any
			namespace: any
			nugget: any
			base: any
			location: any
			$api: $api
			$sdk: any

			/** @deprecated */
			script: any
		}
	}
}

(
	function(
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests
	) {
		tests.suite = function() {
			verify(1).is(1);
		}
	}
//@ts-ignore
)(verify, tests)