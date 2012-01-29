//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME loader for web browsers.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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

	var Bootstrap = function(src) {
		this.base = src.split("/").slice(0,-1).join("/") + "/";

		this.src = src;

		this.getRelativePath = function(path) {
			return this.base + path;
		}
	}

	var getCurrentScript = function() {
		var getCurrentScriptSrc = function() {
			var scripts = document.getElementsByTagName("script");
			var url = scripts[scripts.length-1].getAttribute("src");
			return url;
		}

		return new Bootstrap(getCurrentScriptSrc());
	}

	var bootstrap = (function() {
		return (inonit.loader && inonit.loader.url) ? new Bootstrap(inonit.loader.url) : getCurrentScript();
	})();

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
				//	Add sourceURL for Firebug
				code = code + "//@ sourceURL=" + path;
				return code;
			}
			this.getCode.preprocessors = [];
		}

		var platform = (function() {
			return eval(fetcher.getCode(bootstrap.getRelativePath("literal.js")));
		})();
		platform.$api.deprecate.warning = function(access) {
			debugger;
		}
		platform.$api.experimental.warning = function(access) {
			//	TODO	should configure this via property of inonit.loader
			//	Can set breakpoint here to pop into debugger on experimental accesses
			var breakpoint = null;
		}

		var instantiate = {};

		this.module = function(code,args) {
			var createModuleLoader = function(code) {
				return new function() {
					this.main = (code.main) ? code.main : "module.js";

					this.getCode = function(path) {
						if (instantiate[code.base+path]) {
							return function(scope,target) {
								instantiate[code.base+path](scope);
							}
						} else {
							//	TODO	assumes trailing slash when loading module
							return fetcher.getCode(code.base+path);
						}
					}
				}
			}

			if (typeof(code) == "string") {
				if (/\/$/.test(code)) {
					code = { base: code };
				} else {
					var tokens = code.split("/");
					code = { base: tokens.slice(0,tokens.length-1).join("/"), main: tokens[tokens.length-1] };
				}
			}

			if (typeof(args) == "object") {
				if (args.$context && args.$exports) {
				} else {
					args = {
						$context: args,
						$exports: {}
					}
				}
			}

			return platform.module(createModuleLoader(code),args);
		}

		this.file = function(path,$context) {
			return platform.file(fetcher.getCode(path),$context);
		};

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
		}

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
			this.api = platform.$api;
		}

		//	Used by loader/browser/tools/offline.html, which may be obsolete

		this.setLoader = function(loader) {
			fetch.loader = loader;
		}

		//	TODO set to dontenum if possible
		this.$sdk = sdk;
	}
})();