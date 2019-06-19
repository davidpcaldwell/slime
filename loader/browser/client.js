//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for web browsers.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	var $context = (window.inonit && window.inonit.loader) ? window.inonit.loader : {
	};
	if (!$context.debug) $context.debug = function(message) {};
	if ($context.XMLHttpRequest) {
		window.XMLHttpRequest = $context.XMLHttpRequest;
	}
	if (!window.XMLHttpRequest) {
		window.XMLHttpRequest = function() {
			var req = false;
			try {
				req = new ActiveXObject("Msxml2.XMLHTTP");
			} catch(e) {
				try {
					req = new ActiveXObject("Microsoft.XMLHTTP");
				} catch(e) {
					$context.debug("Error instantiating XMLHttpRequest using ActiveX");
					throw e;
				}
			}
			return req;
		}
	}
	//	Undocumented for now; seemingly unused
	if (!$context.url) $context.url = void(0);
	if (!$context.callback) $context.callback = function(){};

	var $exports = (function() {
		if (!window.inonit) window.inonit = {};
		if (window.inonit.loader && window.inonit.loader.run && window.inonit.loader.file && window.inonit.loader.module) {
			throw new Error("Unimplemented: trying to reload inonit.loader");
		}
		window.inonit.loader = {};
		return window.inonit.loader;
	})();

	var Bootstrap = function(base) {
		this.base = base;

		this.getRelativePath = function(path) {
			return this.base + path;
		}
	}

	var getCurrentScriptElement = function() {
		if ($context.script) return $context.script;
		var scripts = document.getElementsByTagName("script");
		return scripts[scripts.length-1];
	}

	var getCurrentScriptSrc = function() {
		if (getCurrentScriptElement().getAttribute("inonit.loader.src")) return getCurrentScriptElement().getAttribute("inonit.loader.src");
		return getCurrentScriptElement().getAttribute("src");
	};

	var canonicalize = function(current) {
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

	var getCurrent = function(base) {
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

	var bootstrap = (function() {
		if ($context.url) return new Bootstrap($context.url);
		if ($context.base) return new Bootstrap(getCurrent($context.base));
		return getCurrentScript();
	})();

	var callback = (inonit.loader && inonit.loader.callback) ? inonit.loader.callback : function(){};

	//	Now even if the object existed before, we have obtained the specified properties and we replace the existing object with
	//	this one
	(function() {

		var fetcher = new function() {
			var downloads = {};

			var get = function(path) {
				$context.debug("Fetching: " + path);
				var req = new XMLHttpRequest();
				if (arguments.callee.loader && arguments.callee.loader.mapping) {
					var mapped = arguments.callee.loader.mapping(path);
					if (typeof(mapped) != "undefined" && mapped != path) {
						$context.debug("Mapping: " + path + " to: " + mapped);
						path = mapped;
					}
				}
				req.open("GET", path, false);
				req.send(null);
				//	TODO	throw actual error object
				if (req.status >= 400) {
					var error = new Error("Status: " + req.status);
					error.code = req.status;
					error.message = req.statusText;
					error.page = req.responseText;
					error.toString = function() {
						return String(req.status) + " " + req.statusText
					};
					throw error;
				};
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

		// TODO: with the reorganization of the platform, 'runtime' is probably the best name for this object now
		var platform = (function() {
			var $slime = {
				getLoaderScript: function(path) {
					return {
						name: bootstrap.getRelativePath(path),
						code: fetcher.getCode(bootstrap.getRelativePath(path))
					}
				},
				getCoffeeScript: function() {
					return (window.CoffeeScript) ? { object: window.CoffeeScript } : null;
				}
			};
			if ($context.$slime) $slime.flags = $context.$slime.flags;
			return eval(fetcher.getCode(bootstrap.getRelativePath("expression.js")));
		})();
		platform.$api.deprecate.warning = function(access) {
			debugger;
		}
		platform.$api.experimental.warning = function(access) {
			//	TODO	should configure this via property of inonit.loader
			//	Can set breakpoint here to pop into debugger on experimental accesses
			var breakpoint = null;
		}

		var Loader = function(p) {
			if (typeof(p) == "string") {
				p = (function(prefix) {
					return {
						get: function(path) {
							try {
								var code = fetcher.get(prefix+path);
								if (code.contentType == "application/javascript") {
									//	Add sourceURL for JavaScript debuggers
									code.responseText += "\n//# sourceURL=" + prefix+path;
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
			platform.Loader.apply(this,arguments);
		};
		Loader.series = platform.Loader.series;

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
		}

		var getPageBase = function() {
			return getCurrentBase().split("/").slice(0,-1).join("/") + "/";
		};

		(function() {
			this.loader = new Loader(getPageBase());
		}).call(this);

		this.Loader = Loader;

		this.Loader.getCode = fetcher.getCode;
		this.Loader.fetch = fetcher.fetch;

		this.script = platform.$api.deprecate(this.file);

		this.namespace = function(name) {
			return platform.namespace(name);
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

		if ($context.base) {
			this.location = $context.base;
		}

		//	For use in scripts that are loaded directly by the browser rather than via this loader
		this.$api = platform.$api;

		var sdk = new function() {
			//	TODO	How is this used?
			this.fetch = function(url) {
				return fetcher.fetch(url);
			}

			//	used by unit tests
			this.platform = platform.$platform;
			//	this variable is now public above
			this.api = platform.$api;
		}

		//	Used by loader/browser/tools/offline.html, which may be obsolete

		this.setLoader = function(loader) {
			//	TODO	this would not work currently; fetch is private
			fetch.loader = loader;
		}

		//	TODO set to dontenum if possible
		this.$sdk = sdk;

		$context.callback.call(this);
	}).call($exports);
})();