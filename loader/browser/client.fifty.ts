/**
 * The SLIME browser runtime can be loaded by executing the `loader/browser/client.js` script. The runtime can be configured by
 * creating a `window.inonit.loader` of type {@link Settings} before loading the runtime. The `window` object itself is presented
 * to the script as a {@link Context} object, and can be further configured by manipulating that object's writable properties.
 * Based on the configuration, a `window.inonit` object of type
 * {@link Runtime} will be created and be available to the application.
 */
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

	/**
	 * The state of the `window` object prior to loading the `loader/browser/client.js` script.
	 */
	export interface Context {
		readonly location: Location
		XMLHttpRequest: typeof XMLHttpRequest
		CoffeeScript: any
	}

	export interface Exports {
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

	export interface Runtime {
		loader: Exports
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