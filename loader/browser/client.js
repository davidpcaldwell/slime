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
	if (!$context.XMLHttpRequest) $context.XMLHttpRequest = (function() {
		if (typeof(window.XMLHttpRequest) == "undefined") {
			return function() {
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
		} else {
			return window.XMLHttpRequest;
		}
	})();
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

	var getCurrentScript = function() {
		var base = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.substring(1);

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

			var fetch = function(path) {
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
				if (req.status >= 400) throw {
					code: req.status,
					message: req.statusText,
					toString: function() { return String(req.status) + " " + req.statusText }
				};
				return req.responseText;
			}

			this.fetch = fetch;

			var getCode = function(path) {
				if (!downloads[path]) {
					downloads[path] = fetch(path);
				}
				return downloads[path];
			}

			this.getCode = function(path) {
				var code = getCode(path);
				for (var i=0; i<arguments.callee.preprocessors.length; i++) {
					code = arguments.callee.preprocessors[i](code);
				}
				//	TODO	probably should reorganize so that sourceURL can be added for CoffeeScript after compilation
				return code;
			}
			this.getCode.preprocessors = [];
		}

		var platform = (function() {
			var $slime = {
				getCode: function(path) {
					return fetcher.getCode(bootstrap.getRelativePath(path));
				},
				getCoffeeScript: function() {
					return (window.CoffeeScript) ? { object: window.CoffeeScript } : null;
				}
			};
			return eval(fetcher.getCode(bootstrap.getRelativePath("literal.js")));
		})();
		platform.run.spi.preprocess(function(underlying) {
			return function(script) {
				if (!/\.coffee$/.test(script.path)) {
					//	Add sourceURL for JavaScript debuggers
					script.code = script.code + "\n//# sourceURL=" + script.path;
				}
			}
		});
		platform.$api.deprecate.warning = function(access) {
			debugger;
		}
		platform.$api.experimental.warning = function(access) {
			//	TODO	should configure this via property of inonit.loader
			//	Can set breakpoint here to pop into debugger on experimental accesses
			var breakpoint = null;
		}

		var loader = new platform.Loader({
			getScript: function(path) {
				return { name: path, path: path, code: fetcher.getCode(path) };
			}
		});

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
			return loader.module.apply(loader,arguments);
		}

		this.Loader = function(p) {
			if (typeof(p) == "string") {
				return new platform.Loader({
					getScript: function(path) {
						return { name: path, path: p+path, code: fetcher.getCode(p+path) };
					}
				});
			}
			return new platform.Loader(p);
		};

		this.Loader.getCode = fetcher.getCode;
		this.Loader.fetch = fetcher.fetch;

		this.script = platform.$api.deprecate(this.file);

		this.namespace = function(name) {
			return platform.namespace(name);
		}

		this.nugget = new function() {
			//	This is provided so that others do not have to go through the rigamarole of determining how to instantiate this.
			this.XMLHttpRequest = XMLHttpRequest;

			//	DRY:	Other scripts may want to use this (already have examples)
			this.getCurrentScript = getCurrentScript;
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