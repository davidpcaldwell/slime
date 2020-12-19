namespace slime.browser {
	/**
	 * The `inonit.loader` module is configured specially, given that it bootstraps the module system. To configure the module, one
	 * must create a global `inonit` object with a `loader` property containing configuration information. If this
	 * `inonit.loader` object is present, its properties are used to create the functioning `inonit.loader` object (which replaces
	 * the configuration object in the global scope).
	 */
	export interface Settings {
		/**
		 * The implementation of `XMLHttpRequest` to use. By default, the module attempts to use the `XMLHttpRequest` implementation
		 * in the browser (including ActiveX implementations).
		 */
		XMLHttpRequest?: typeof XMLHttpRequest
	}

	export interface Context {
		location: Location

		XMLHttpRequest: typeof XMLHttpRequest
		inonit: Exports
		CoffeeScript: any
	}

	export interface Runtime {
		//	top-level loader methods that operate by URL
		run: any
		file: any
		module: any
		value: any
		get: any

		loader: any
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

	export interface Exports {
		loader: Runtime
	}
}

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.suite = function() {
			fifty.verify(1).is(1);
		}
	}
//@ts-ignore
)(fifty)