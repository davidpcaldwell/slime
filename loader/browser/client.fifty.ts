//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	/**
	 * The SLIME browser runtime can be loaded by executing the `loader/browser/client.js` script. The runtime can be configured by
	 * creating a `window.inonit.loader` of type {@link slime.browser.Settings} before loading the runtime. The script also is presented the `window`
	 * object itself as a value of type {@link slime.browser.Context}, so can be further configured by manipulating the writable properties of
	 * `Context` on `window`.
	 *
	 * Based on the configuration, a `window.inonit` object of type
	 * {@link slime.browser.Runtime} will be created and be available to the application.
	 *
	 * All additional code loaded through the runtime will be provided with a {@link slime.$api.Global} object in its scope as `$api`.
	 * This object is also available to code not loaded through the runtime (for example, top-level scripts) as `inonit.loader.$api`.
	 *
	 * Several additional APIs can be loaded from the `Runtime`:
	 *
	 * Path           | Description                                                                                   | Documentation
	 * -------------- | --------------------------------------------------------------------------------------------- | ----------------------------------
	 * `js/web/`      |  Web-related concepts like URLs and form data.                                                | {@link slime.web.Script}
	 * `js/time/`     | Dates and times.                                                                              | {@link slime.time.Script}
	 * `js/document/` | **Deprecated.** XML and HTML documents                                                        | {@link slime.old.document.Script}
	 * `js/promise/`  | **Deprecated.** Asynchronous programming using A+-like Promises.                              | {@link slime.promise.Script}
	 * `js/object/`   | **Deprecated.** General JavaScript APIs; mostly replaced by {@link slime.$api.Exports | $api} | {@link slime.$api.old.Exports}
	 *
	 * There are some additional APIs, all deprecated, that pertain to testing with the deprecated JSAPI implementation:
	 *
	 * Path                                                                    | Description                                                                         | Documentation
	 * ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----
	 * `loader/api/old/unit.js`                                                | JSAPI unit testing implementation                                                   | {@link slime.definition.unit.Exports}
	 * `loader/api/old/api.html.js`                                                | JSAPI definition files                                                              | `loader/api/old/api.html`
	 * `loader/api/old/browser/module.js`                                      | Browser implementation of JSAPI unit tests; browser test suite definition           | `loader/browser/test/api.html`
	 * `loader/api/ui/loader.js`                                               | A bundle including the above two APIs, as well as a UI for executing unit tests     | `loader/api/ui/loader.api.html`
	 * `loader/api/old/jsh/plugin.jsh.browser.js`                                        | Undocumented API that allows JSAPI definition files to be executed in a browser     |
	 * `loader/browser/test/suite.jsh.js` and `loader/browser/test/suite.bash` | `jsh` script that launches a browser test suite (or an individual definition file). | `loader/browser/test/suite.jsh.api.html`
	 */
	export namespace browser {
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

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);


		/**
		 * The state of the `window` object prior to loading the `loader/browser/client.js` script.
		 */
		export interface Context {
			readonly fetch: Window["fetch"]
			readonly location: Location
			Date: DateConstructor
			setTimeout: Window["setTimeout"]
			clearTimeout: Window["clearTimeout"]
			XMLHttpRequest: typeof XMLHttpRequest
			CoffeeScript: any
			Packages: slime.jrunscript.Packages
		}

		interface Bootstrap {
			/**
			 * The base URL of this script: the URL of the script, excluding the file name.
			 */
			base: string

			/**
			 * @param path A relative path.
			 * @returns A full path representing the specified relative path relative to the base URL of this script.
			 */
			getRelativePath: (path: string) => string
		}

		export interface Exports {
			base: string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var endsWith = function(suffix: string) {
					return Object.assign(
						function(string: string) {
							return string.endsWith(suffix);
						},
						{
							toString: function() { return "endsWith(" + suffix + ")"; }
						}
					);
				}

				fifty.tests.exports.base = function() {
					var runtime: slime.browser.Exports = fifty.global.window["inonit"].loader;
					fifty.verify(runtime,"runtime").base.evaluate(endsWith("/")).is(true);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			Loader: {
				/**
				 * Creates a SLIME {@link slime.Loader | Loader}.
				 *
				 * @param p A URL which should be used as the base URL of the loader.
				 */
				new (p: string): slime.old.Loader

				/**
				 * Creates a SLIME {@link slime.Loader | Loader}; see {@link slime.loader.Source}.
				 */
				new (p: slime.old.loader.Source): slime.old.Loader

				series: slime.runtime.Exports["old"]["loader"]["series"]
				//	TODO	JSAPI-declared properties below
				//	getCode
				//	fetch
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const inonit: Runtime = fifty.global.window["inonit"];

				fifty.tests.bitbucketIssue296 = function() {
					var hasSourceUrl = function(p) {
						return p.string.indexOf("sourceURL") != -1;
					};

					var loader = new inonit.loader.Loader(inonit.loader.base + "../");

					var resource = function(path) {
						var resource = loader.get(path);
						return {
							type: resource.type,
							string: resource.read(String)
						};
					}

					verify(inonit).loader.base.is(inonit.loader.base);
					var js = resource("loader/expression.js");
					var css = resource("loader/api/old/api.css");
					var html = resource("README.html");
					verify(js,"js").evaluate(hasSourceUrl).is(true);
					verify(js).type.media.is("application");
					verify(js).type.subtype.is("javascript");
					verify(css,"css").evaluate(hasSourceUrl).is(false);
					//verify(css,"css").type.is.type("text/css");
					if (css.type) {
						verify(css).type.media.is("text");
						verify(css).type.subtype.is("css");
					}
					verify(html,"html").evaluate(hasSourceUrl).is(false);
					//	TODO: Unclear why the below construct does not work; is it because of the property named 'type', or maybe
					//	the 'is' method?
					// verify(html,"html").type.is.type("object");
					if (html.type) {
						verify(html).type.media.is("text");
						verify(html).type.subtype.is("html");
					}
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			/**
			 * See {@link slime.runtime.Exports.namespace}.
			 */
			namespace: slime.runtime.Exports["namespace"]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const inonit: Runtime = fifty.global.window["inonit"];
				const window = fifty.global.window as Window & { testNamespaces: any }
				fifty.tests.exports.namespace = {};

				const test = function(value: boolean) {
					fifty.verify(value).is(true);
				};

				fifty.tests.exports.namespace.happy = function() {
					test(typeof(window.testNamespaces) == "undefined");
					var ns = inonit.loader.namespace("testNamespaces.foo.bar.baz");
					test(ns == window.testNamespaces.foo.bar.baz);
				}

				fifty.tests.exports.namespace.topLevelScope = function() {
					var f = function() {
						return this;
					}

					var x = new function() {
						this.f = f;
					}

					test(f() == window);
					test(x.f() != window);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			/**
			 * See {@link slime.Loader.run}. Note that the first argument will be interpreted relative to the current page.
			 */
			run: slime.Loader["run"]

			/**
			 * See {@link slime.Loader.file}. Note that the first argument will be interpreted relative to the current page.
			 */
			file: slime.Loader["file"]

			/**
			 * See {@link slime.Loader.module}. Note that the first argument will be interpreted relative to the current page.
			 */
			module: slime.Loader["module"]

			/**
			 * See {@link slime.Loader.value}. Note that the first argument will be interpreted relative to the current page.
			 */
			value: slime.old.Loader["value"]

			get: slime.Loader["get"]

			/**
			 * A loader that loads resources using the current page as the base URL for the loader.
			 */
			loader: slime.old.Loader

			/**
			 * Contains useful pieces of code that are exported for general use.
			 */
			nugget: {
				/**
				 * Returns an object based on the current script being loaded (that is, the script from which the method is invoked).
				 */
				getCurrentScript: () => Bootstrap

				//	TODO	this structure is almost the same as the Bootstrap structure above; can we combine them?
				page: {
					base: string
					relative: (path: string) => string
				}
			}

			$api: slime.$api.Global

			test: {
				run: slime.runtime.Exports["run"]
			}

			//	(undocumented) According to very old documentation, used to support development-related functions.
			$sdk: any

			/** @deprecated */
			script: any
		}

		export interface Runtime {
			loader: Exports
		}

	}
}

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		fifty.tests.suite = function() {
			fifty.run(fifty.tests.exports);
			fifty.run(fifty.tests.bitbucketIssue296);
			fifty.load("$api.fifty.ts");
		}
	}
//@ts-ignore
)(fifty)
