//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.browser.Context & { inonit: slime.browser.Runtime } } window
	 * @param { slime.browser.Settings } $context - provided by setting `inonit.loader` before loading this script
	 */
	function(window,$context) {
		(
			function setXmlHttpRequest() {
				if ($context.XMLHttpRequest) {
					window.XMLHttpRequest = $context.XMLHttpRequest;
				}
				if (!window.XMLHttpRequest) {
					//@ts-ignore
					window.XMLHttpRequest = function() {
						var req = false;
						try {
							//@ts-ignore
							req = new ActiveXObject("Msxml2.XMLHTTP");
						} catch(e) {
							//@ts-ignore
							req = new ActiveXObject("Microsoft.XMLHTTP");
						}
						return req;
					}
				}
			}
		)();

		/**
		 *
		 * @param { string } base A base URL for boostrapping SLIME, whose base is the SLIME `loader/` directory.
		 */
		function Bootstrap(base) {
			return {
				base: base,
				getRelativePath: function(path) {
					return base + path;
				}
			};
		}

		var getCurrentScriptElement = function() {
			var scripts = document.getElementsByTagName("script");
			return scripts[scripts.length-1];
		}

		var getCurrentScriptSrc = function() {
			if (getCurrentScriptElement().getAttribute("inonit.loader.src")) return getCurrentScriptElement().getAttribute("inonit.loader.src");
			return getCurrentScriptElement().getAttribute("src");
		};

		/**
		 *
		 * @param { string } current
		 * @returns { string }
		 */
		function canonicalize(current) {
			//	TODO	The next block is not very robust but probably works for most, or even all, cases. That said, the js/web
			//			module has a better implementation of URL canonicalization.
			//			This mostly matters for debuggers that try to map URLs to files or whatever; they may not be able to handle
			//			paths with .. correctly (Google Chrome, for example, does not).
			var tokens = current.split("/");
			for (var i=0; i<tokens.length; i++) {
				if (tokens[i] == "..") {
					tokens.splice(i-1,2);
					i = i - 2;
				}
			}
			current = tokens.join("/");
			return current;
		}

		/**
		 *
		 * @param { string } currentPage
		 */
		function getLoaderBase(currentPage) {
			var getBasePath = function(pathname) {
				var path = pathname.split("?")[0];
				var tokens = path.split("/");
				if (tokens.length > 1) {
					return tokens.slice(0,-1).join("/") + "/";
				} else {
					return "";
				}
			};

			var rv = getBasePath(currentPage) + getCurrentScriptSrc().split("/").slice(0,-2).join("/") + "/";
			rv = canonicalize(rv);
			return rv;
		}

		var getCurrentPage = function() {
			return window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.substring(1);
		}

		var getBootstrap = function() {
			var page = getCurrentPage();
			var base = getLoaderBase(page);
			return Bootstrap(base);
		}

		var bootstrap = getBootstrap();

		/** @type { slime.browser.Exports } */
		var $exports = (
			function() {

				/** @type { { get: any, threadGet: any, fetch: any, getCode: any } } */
				var fetcher = new function() {
					var downloads = {};

					/** @type { <O,P>(o: O, p: P) => O & P } */
					var assign = function(o,properties) {
						/** @type { any } */
						var rv = o;
						for (var x in properties) {
							rv[x] = properties[x];
						}
						return rv;
					}

					var get = function(path) {
						var req = new XMLHttpRequest();
						req.open("GET", path, false);
						req.send(null);
						//	TODO	throw actual error object
						if (req.status >= 400) {
							throw assign(
								new Error("Status: " + req.status),
								{
									code: req.status,
									message: req.statusText,
									page: req.responseText,
									toString: function() {
										return String(req.status) + " " + req.statusText
									}
								}
							);
						}
						return {
							contentType: req.getResponseHeader("Content-Type"),
							responseText: req.responseText
						};
					};

					var threadGet = function(path) {
						return window.fetch(path).then(function(response) {
							return Promise.all([Promise.resolve(response.headers.get("Content-Type")), response.text()]);
						}).then(function(resolved) {
							return {
								contentType: resolved[0],
								responseText: resolved[1]
							}
						})
					};

					this.get = get;
					this.threadGet = threadGet;

					var fetch = function(path) {
						var got = get(path);
						return got.responseText;
					}

					this.fetch = fetch;

					var getCode = function(path) {
						if (!downloads[path]) {
							downloads[path] = get(path);
						}
						return downloads[path].responseText + "//# sourceURL=" + path;
					}

					//	TODO	probably should reorganize so that sourceURL can be added for CoffeeScript after compilation
					this.getCode = getCode;
				}

				/** @type { slime.runtime.Scope } */
				var scope = {
					$engine: {
						execute: function(/*script{name,js},scope,target*/) {
							return (function() {
								//@ts-ignore
								with( arguments[1] ) {
									return eval(arguments[0]);
								}
							}).call(
								arguments[2],
								arguments[0].js, arguments[1]
							);
						}
					},
					$slime: {
						getRuntimeScript: function(path) {
							return {
								name: bootstrap.getRelativePath(path),
								js: fetcher.getCode(bootstrap.getRelativePath(path))
							}
						}
					},
					Packages: window.Packages
				};

				/** @type { slime.runtime.Exports } */
				var runtime = (function(scope) {
					//	TODO	still uses synchronous API
					/** @type { slime.runtime.Exports } */
					var rv = eval(fetcher.getCode(bootstrap.getRelativePath("expression.js")));
					rv.$api.deprecate.warning = function(access) {
						debugger;
					}
					rv.$api.experimental.warning = function(access) {
						//	TODO	should configure this via property of inonit.loader
						//	Can set breakpoint here to pop into debugger on experimental accesses
						var breakpoint = null;
					}
					if (window.CoffeeScript) {
						rv.compiler.update(function(was) {
							return rv.$api.fp.switch([
								was,
								rv.$api.scripts.Compiler.from.simple({
									accept: rv.$api.scripts.Code.isMimeType("application/vnd.coffeescript"),
									name: function(code) { return code.name; },
									read: function(code) { return code.read(); },
									compile: window.CoffeeScript.compile
								})
							])
						})
					}
					return rv;
				})(scope);

				/**
				 * @constructor
				 * @param { string | slime.old.loader.Source } p
				 */
				var Loader = function(p) {
					if (typeof(p) == "string") {
						p = (
							/**
							 *
							 * @param { string } prefix
							 * @returns { slime.old.loader.Source }
							 */
							function(prefix) {
								/**
								 *
								 * @param { string } prefix
								 * @param { string } path
								 * @param { { contentType: string, responseText: string } } code
								 * @returns { slime.resource.Descriptor }
								 */
								var toResourceDescriptor = function(prefix,path,code) {
									if (code.contentType == "application/javascript") {
										//	Add sourceURL for JavaScript debuggers
										code.responseText += "\n//# sourceURL=" + canonicalize(prefix+path);
									}
									// TODO: is 'path' used?
									return {
										type: code.contentType,
										name: path,
										read: runtime.Resource.ReadInterface.string(code.responseText)
									};
								}

								return {
									get: function(path) {
										try {
											var code = fetcher.get(prefix+path);
											return toResourceDescriptor(prefix,path,code);
										} catch (e) {
											if (e.code == 404) return null;
											throw e;
										}
									},
									thread: {
										get: function(path) {
											return fetcher.threadGet(prefix+path).then(function(code) {
												return toResourceDescriptor(prefix,path,code);
											})
										}
									},
									toString: function() {
										return "Browser loader: prefix=[" + prefix + "]";
									}
								}
							}
						)(canonicalize(p));
					}
					this.source = void(0);
					this.run = void(0);
					this.value = void(0);
					this.file = void(0);
					this.module = void(0);
					this.script = void(0);
					this.factory = void(0);
					this.Child = void(0);
					this.get = void(0);
					this.toSynchronous = void(0);
					runtime.old.Loader.apply(this,arguments);
				};

				var bootstrapper = new Loader(bootstrap.base);

				var code = {
					/** @type { slime.browser.internal.$api.Script } */
					browser: bootstrapper.script("browser/$api.js")
				};

				Object.assign(runtime.$api, code.browser({
					time: {
						Date: window.Date,
						setTimeout: window.setTimeout,
						clearTimeout: window.clearTimeout
					}
				}));

				var getPageBase = function() {
					return getCurrentPage().split("/").slice(0,-1).join("/") + "/";
				};

				var loaderMethods = (
					function() {
						/** @type { slime.Loader } */
						var loader = new Loader("");

						return {
							run: function(path,scope,target) {
								return loader.run.apply(loader,arguments);
							},
							file: function(path,$context) {
								return loader.file.apply(loader,arguments);
							},
							module: function(path,$context) {
								return loader.module.apply(loader,arguments);
							},
							value: function(path,scope,target) {
								return loader.value.apply(loader,arguments);
							},
							get: function(path) {
								return loader.get.apply(loader,arguments);
							}
						};
					}
				)();

				return Object.assign(
					{
						loader: new Loader(getPageBase()),
						Loader: Object.assign(
							Loader,
							{
								series: runtime.old.loader.series,
								getCode: fetcher.getCode,
								fetch: fetcher.fetch
							}
						),
						script: runtime.$api.deprecate(loaderMethods.file),
						namespace: function(name) {
							return runtime.namespace(name);
						},
						nugget: new function() {
							//	DRY:	Other scripts may want to use this (already have examples)
							this.getCurrentScript = getBootstrap;

							this.page = {
								base: getPageBase(),
								relative: function(path) {
									return canonicalize(getPageBase() + path);
								}
							};
						},
						//	TODO	we may want a base attribute; the below is one way to do it which should work under most circumstances.
						//			We could make it the responsibility of the caller to set the 'base' property if this file is loaded another way.
						//	Undocumented
						base: bootstrap.base,
						//	For use in scripts that are loaded directly by the browser rather than via this loader
						$api: runtime.$api,
						//	(Possibly obsolete comment to follow) Used by loader/browser/tools/offline.html, which may be obsolete
						$sdk: new function() {
							//	Used via inonit.loader.$sdk.fetch call in loader/browser/test somehow
							this.fetch = function(url) {
								return fetcher.fetch(url);
							}

							//	used by unit tests <-- old comment; used in loader/browser/test/api.js somehow
							this.platform = runtime.$platform;
						}
					},
					loaderMethods
				)
			}
		)();

		if (!window.inonit) window.inonit = {
			loader: void(0)
		};
		window.inonit.loader = $exports;
	}
//@ts-ignore
)(window, (window.inonit && window.inonit.loader) ? window.inonit.loader : {});
