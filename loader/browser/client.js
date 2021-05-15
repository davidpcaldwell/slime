//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.browser.Settings } $context - provided by setting `inonit.loader` before loading this script
	 * @param { slime.browser.Context & { inonit: slime.browser.Runtime } } window
	 */
	function($context,window) {
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
							req = new ActiveXObject("Msxml2.XMLHTTP");
						} catch(e) {
							req = new ActiveXObject("Microsoft.XMLHTTP");
						}
						return req;
					}
				}
			}
		)();

		/** @type { slime.browser.Exports } */
		var $exports = (function() {
			if (!window.inonit) window.inonit = {
				loader: void(0)
			};
			if (window.inonit.loader && window.inonit.loader.run && window.inonit.loader.file && window.inonit.loader.module) {
				throw new Error("Unimplemented: trying to reload inonit.loader");
			}
			window.inonit.loader = {
				run: void(0),
				file: void(0),
				module: void(0),
				value: void(0),
				get: void(0),
				loader: void(0),
				Loader: void(0),
				namespace: void(0),
				nugget: void(0),
				base: void(0),
				location: void(0),
				$api: void(0),
				$sdk: void(0),
				script: void(0)
			};
			return window.inonit.loader;
		})();

		/**
		 *
		 * @param { string } base
		 */
		function Bootstrap(base) {
			this.base = base;

			this.getRelativePath = function(path) {
				return this.base + path;
			}
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
		 * @param { string } base
		 */
		function getCurrent(base) {
			var getBasePath = function(pathname) {
				var path = pathname.split("?")[0];
				var tokens = path.split("/");
				if (tokens.length > 1) {
					return tokens.slice(0,-1).join("/") + "/";
				} else {
					return "";
				}
			};

			var rv = getBasePath(base) + getCurrentScriptSrc().split("/").slice(0,-2).join("/") + "/";
			rv = canonicalize(rv);
			return rv;
		}

		var getCurrentBase = function() {
			return window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.substring(1);
		}

		var getCurrentScript = function() {
			var base = getCurrentBase();
			var current = getCurrent(base);
			return new Bootstrap(current);
		}

		var bootstrap = getCurrentScript();

		//	Now even if the object existed before, we have obtained the specified properties and we replace the existing object with
		//	this one
		(
			/**
			 * @this { slime.browser.Runtime["loader"] }
			 */
			function() {

				var fetcher = new function() {
					var downloads = {};

					/** @type { <O,P>(o: O, p: P) => O & P } */
					var assign = function(o,properties) {
						for (var x in properties) {
							o[x] = properties[x];
						}
						return o;
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

					this.get = get;

					var fetch = function(path) {
						var got = get(path);
						return got.responseText;
					}

					this.fetch = fetch;

					var getCode = function(path) {
						if (!downloads[path]) {
							downloads[path] = get(path);
						}
						return downloads[path].responseText;
					}

					//	TODO	probably should reorganize so that sourceURL can be added for CoffeeScript after compilation
					this.getCode = getCode;
				}

				/** @type { slime.runtime.Exports } */
				var runtime = (function($engine,$slime,Packages) {
					var rv = eval(fetcher.getCode(bootstrap.getRelativePath("expression.js")));
					rv.$api.deprecate.warning = function(access) {
						debugger;
					}
					rv.$api.experimental.warning = function(access) {
						//	TODO	should configure this via property of inonit.loader
						//	Can set breakpoint here to pop into debugger on experimental accesses
						var breakpoint = null;
					}
					return rv;
				})(
					/* $engine */ void(0),
					/* $slime */ {
						getRuntimeScript: function(path) {
							return {
								name: bootstrap.getRelativePath(path),
								js: fetcher.getCode(bootstrap.getRelativePath(path))
							}
						},
						getCoffeeScript: function() {
							return (window.CoffeeScript) ? { object: window.CoffeeScript } : null;
						}
					},
					/* Packages */ window["Packages"]
				);

				/**
				 * @type { slime.browser.Exports["Loader"] }
				 * @param { string | slime.loader.Source } p
				 */
				var Loader = function(p) {
					if (typeof(p) == "string") {
						p = (function(prefix) {
							return {
								get: function(path) {
									try {
										var code = fetcher.get(prefix+path);
										if (code.contentType == "application/javascript") {
											//	Add sourceURL for JavaScript debuggers
											code.responseText += "\n//# sourceURL=" + canonicalize(prefix+path);
										}
										// TODO: is 'path' used?
										return { type: code.contentType, name: path, string: code.responseText, path: prefix+path };
									} catch (e) {
										if (e.code == 404) return null;
										throw e;
									}
								},
								toString: function() {
									return "Browser loader: prefix=[" + prefix + "]";
								}
							}
						})(canonicalize(p));
					}
					runtime.Loader.apply(this,arguments);
				};
				Loader.series = runtime.Loader.series;

				var getPageBase = function() {
					return getCurrentBase().split("/").slice(0,-1).join("/") + "/";
				};

				(
					function() {
						var loader = new Loader("");

						this.run = function(path,scope,target) {
							return loader.run.apply(loader,arguments);
						};

						this.file = function(path,$context) {
							return loader.file.apply(loader,arguments);
						};

						this.module = function(path,$context) {
							return loader.module.apply(loader,arguments);
						}

						this.value = function(path,scope,target) {
							return loader.value.apply(loader,arguments);
						};

						this.get = function(path) {
							return loader.get.apply(loader,arguments);
						};
					}
				).call(this);

				(function() {
					this.loader = new Loader(getPageBase());
				}).call(this);

				this.Loader = Object.assign(
					Loader,
					{
						getCode: fetcher.getCode,
						fetch: fetcher.fetch
					}
				)

				this.script = runtime.$api.deprecate(this.file);

				this.namespace = function(name) {
					return runtime.namespace(name);
				}

				this.nugget = new function() {
					//	DRY:	Other scripts may want to use this (already have examples)
					this.getCurrentScript = getCurrentScript;

					this.page = {
						base: getPageBase(),
						relative: function(path) {
							return canonicalize(getPageBase() + path);
						}
					};
				};

				//	TODO	Experimental API currently used by httpd, perhaps should be kept (and possibly made more robust)

				//	TODO	we may want a base attribute; the below is one way to do it which should work under most circumstances.
				//			We could make it the responsibility of the caller to set the 'base' property if this file is loaded another way.

				//	Undocumented
				this.base = bootstrap.base;

				//	For use in scripts that are loaded directly by the browser rather than via this loader
				this.$api = runtime.$api;

				//	Used by loader/browser/tools/offline.html, which may be obsolete

				//	TODO set to dontenum if possible
				this.$sdk = new function() {
					//	Used via inonit.loader.$sdk.fetch call in loader/browser/test somehow
					this.fetch = function(url) {
						return fetcher.fetch(url);
					}

					//	used by unit tests <-- old comment; used in loader/browser/test/api.js somehow
					this.platform = runtime.$platform;
				};
			}
		).call($exports);
	}
//@ts-ignore
)((window.inonit && window.inonit.loader) ? window.inonit.loader : {}, window);
