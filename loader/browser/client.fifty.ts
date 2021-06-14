//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The SLIME browser runtime can be loaded by executing the `loader/browser/client.js` script. The runtime can be configured by
 * creating a `window.inonit.loader` of type {@link Settings} before loading the runtime. The `window` object itself is presented
 * to the script as a {@link Context} object, and can be further configured by manipulating that object's writable properties.
 * Based on the configuration, a `window.inonit` object of type
 * {@link Runtime} will be created and be available to the application.
 *
 * All additional code loaded through the runtime will be provided with a {@link $api} object in its scope as `$api`.
 *
 * Several additional APIs can be loaded from the `Runtime`:
 *
 * Path           | Description
 * -------------- | ----------------------------------
 * `js/web/`      | {@link slime.web.Exports}
 * `js/time/`     | {@link slime.time.Exports}
 * `js/document/` | XML and HTML documents
 * `js/promise/`  | Asynchronous programming using A+-like promises
 * `js/object/`   | {@link slime.runtime.old.Exports}
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

	interface Bootstrap {

	}

	export interface Exports {
		//	top-level loader methods that operate by URL
		run: slime.Loader["run"]
		file: slime.Loader["file"]
		module: slime.Loader["module"]
		value: slime.Loader["value"]
		get: slime.Loader["get"]

		loader: slime.Loader
		Loader: {
			new (p: string | slime.loader.Source): slime.Loader
			series: slime.runtime.Exports["Loader"]["series"]
		}
		namespace: any
		nugget: {
			getCurrentScript: () => Bootstrap
			page: {
				base: string
				relative: (path: string) => string
			}
		}
		base: string
		$api: slime.$api.Global
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
			var runtime = fifty.global.window["inonit"].loader;
			var base = runtime.base;
			var endsInSlash = base.substring(base.length-1) == "/";
			fifty.verify(endsInSlash).is(true);
			fifty.verify(1).is(1);
		}
	}
//@ts-ignore
)(fifty)