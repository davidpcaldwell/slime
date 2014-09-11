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
	if (!window.inonit) {
		window.inonit = {};
	}
	var inonit = window.inonit;

	if (!inonit.loader) {
		//	we will create this object after specifying defaults below
	} else if (inonit.loader && inonit.loader.module && inonit.loader.script && inonit.loader.namespace) {
		//	already loaded, what to do?
		throw "Unimplemented";
	} else {
		//	caller created the object inonit.module to configure this object before usage
		//	debug/XMLHttpRequest/modes are configurable; see initialization below.
	}

	var debug = (inonit.loader && inonit.loader.debug) ? inonit.loader.debug : function(message) {};

	var XMLHttpRequest = (inonit.loader && inonit.loader.XMLHttpRequest) ? inonit.loader.XMLHttpRequest : (function() {
		if (typeof(window.XMLHttpRequest) == "undefined") {
			return function() {
				var req = false;
				try {
					req = new ActiveXObject("Msxml2.XMLHTTP");
				} catch(e) {
					try {
						req = new ActiveXObject("Microsoft.XMLHTTP");
					} catch(e) {
						debug("Error instantiating XMLHttpRequest using ActiveX");
						throw e;
					}
				}
				return req;
			}
		} else {
			return window.XMLHttpRequest;
		}
	})();

	var modes = (inonit.loader && inonit.loader.modes) ? inonit.loader.modes : {};
	//	TODO	probably rename these properties to runner and loader or something
	if (!modes.module) modes.module = "evalScope";
	if (!modes.execute) modes.execute = "call";

	var Bootstrap = function(base) {
		this.base = base;

		this.getRelativePath = function(path) {
			return this.base + path;
		}
	}

	var getCurrentScript = function() {
		var getCurrentScriptSrc = function() {
			var scripts = document.getElementsByTagName("script");
			var url = scripts[scripts.length-1].getAttribute("src");
			return url;
		};

		var getBasePath = function(pathname) {
			var path = pathname.substring(1);
			var tokens = path.split("/");
			if (tokens.length > 1) {
				return tokens.slice(0,-1).join("/") + "/";
			} else {
				return "";
			}
		};

		var base = window.location.protocol + "//" + window.location.host + "/" + getBasePath(window.location.pathname);

		var current = base + getCurrentScriptSrc().split("/").slice(0,-2).join("/") + "/";

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

		return new Bootstrap(current);
	}

	var bootstrap = (function() {
		return (inonit.loader && inonit.loader.url) ? new Bootstrap(inonit.loader.url) : getCurrentScript();
	})();

	var callback = (inonit.loader && inonit.loader.callback) ? inonit.loader.callback : function(){};

	//	Now even if the object existed before, we have obtained the specified properties and we replace the existing object with
	//	this one
	inonit.loader = new function() {

		var fetcher = new function() {
			var downloads = {};

			var fetch = function(path) {
				debug("Fetching: " + path);
				var req = new XMLHttpRequest();
				if (arguments.callee.loader && arguments.callee.loader.mapping) {
					var mapped = arguments.callee.loader.mapping(path);
					if (typeof(mapped) != "undefined" && mapped != path) {
						debug("Mapping: " + path + " to: " + mapped);
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
					script.code = script.code + "//# sourceURL=" + script.path;
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

		var instantiate = {};

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

		this.module = function(path,scope,target) {
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

		//	TODO	Experimental API currently used by httpd, perhaps should be kept (and possibly made more robust)

		//	TODO	we may want a base attribute; the below is one way to do it which should work under most circumstances.
		//			We could make it the responsibility of the caller to set the 'base' property if this file is loaded another way.

		this.base = bootstrap.base;

		this.nugget = new function() {
			//	This is provided so that others do not have to go through the rigamarole of determining how to instantiate this.
			this.XMLHttpRequest = XMLHttpRequest;

			//	DRY:	Other scripts may want to use this (already have examples)
			this.getCurrentScript = getCurrentScript;
		};

		//	For use in scripts that are loaded directly by the browser rather than via this loader
		this.$api = platform.$api;

		var sdk = new function() {
			var getCachePath = function(string) {
				if (string.substring(0,1) == "$") {
					return bootstrap.base + string.substring(1);
				} else {
					return string;
				}
			}

			//
			//	API used by scripts that want to register themselves in debugger form
			//
			this.debug = new function() {
				//	TODO	test this when SLIM is up and running
				this.script = function(path,f) {
					debug("Storing script: " + path + " as " + f);
					instantiate[getCachePath(path)] = f;
				}
			}

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
			fetch.loader = loader;
		}

		//	TODO set to dontenum if possible
		this.$sdk = sdk;
	};
	callback(inonit.loader);
})();