//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	return new function() {
		var $platform = (function() {
			var $exports = {};
			$exports.Object = {};
			if (Object.defineProperty) {
				$exports.Object.defineProperty = { ecma: true };
			}
			if (Object.prototype.__defineGetter__) {
				if (!$exports.Object.defineProperty) $exports.Object.defineProperty = {};
				$exports.Object.defineProperty.accessor = true;
			}

			(function() {
				var getJavaClass = function(name) {
					try {
						if (typeof(Packages) == "undefined") return null;
						var rv = Packages[name];
						if (typeof(rv) == "function") {
							//	In the Firefox Java plugin, JavaPackage objects have typeof() == "function". They also have the
							//	following format for their String values
							try {
								var prefix = "[Java Package";
								if (String(rv).substring(0, prefix.length) == prefix) {
									return null;
								}
							} catch (e) {
								//	The string value of Packages.java.lang.Object and Packages.java.lang.Number throws a string (the
								//	below) if you attempt to evaluate it.
								if (e == "java.lang.NullPointerException") {
									return rv;
								}
							}
							return rv;
						}
						return null;
					} catch (e) {
						return null;
					}
				}

				if (getJavaClass("java.lang.Object")) {
					this.java = new function() {
						this.getClass = function(name) {
							return getJavaClass(name);
						}
					};
				}

				try {
					if (typeof($engine) != "undefined") {
						this.Object.defineProperty.setReadOnly = $engine.Object.defineProperty.setReadOnly;
					}
				} catch (e) {
				}
			}).call($exports);

			try {
				if (typeof($engine) != "undefined") {
					if ($engine.MetaObject) {
						$exports.MetaObject = $engine.MetaObject;
					}
				}
			} catch (e) {
			}

			return $exports;
		})();

		var $api = eval($slime.getCode("api.js"));

		var run = function(/*code,scope,this*/) {
			//	TODO	check to understand exactly what leaks into namespace. Does 'runners' for example? 'runScope'? ModuleLoader?
			//	TODO	putting $exports: true as a property of 'this' is designed to allow older modules to know they are being
			//			loaded by the new loader, and should go away when all modules are converted
			return (function() {
				//	$platform is in scope because of the above
				//	$api is also in scope
				with( arguments[1] ) {
					eval(arguments[0]);
				}
			}).apply(
				this,
				arguments
			);
		};

		var runWith = function(code,scope) {
			var runScope = function(initial) {
				//	earlier version copied object but that seems unnecessary
				initial.$platform = $platform;
				initial.$api = $api;
				return initial;
			}

			var fixed = runScope(scope);

			if (typeof(code) == "function") {
				//	it is a function that can execute the code given a scope and target object
				code(fixed,this);
			} else if (typeof(code) == "string") {
				run.call(this,code,fixed);
			} else {
				throw "Unimplemented: typeof(code) = " + typeof(code);
			}
		}

		var createScope = function(scope) {
			var rv;
			if (scope && (scope.$context || scope.$exports)) {
				rv = scope;
			} else if (scope) {
				rv = { $context: scope };
			} else {
				rv = { $context: {} };
			}
			if (!rv.$exports) {
				rv.$exports = {};
			}
			return rv;
		}

		var file = function(code,scope) {
			//	TODO	can we put file in here somehow?
			//	TODO	should we be able to provide a 'this' here?
			var inner = createScope(scope);
			runWith.call(this,code,inner);
			return inner.$exports;
		}

		var Loader = function(p) {
			var Callee = arguments.callee;
			
			this.toString = function() {
				return p.toString();
			}

			this.run = function(path,scope,target) {
				runWith.call(target,p.getCode(path),scope);
			}

			this.file = function(path,scope,target) {
				return file.call(target,p.getCode(path),scope);
			}

			//	Creates a child loader that prepends the given prefix
			var parent = this;
			var Child = function(prefix) {
				return new Callee({
					toString: function() {
						return parent.toString() + " prefix=" + prefix;
					},
					getCode: function(path) {
						return p.getCode(prefix+path);
					}
				});
			};

			this.module = function(path,scope,target) {
				var inner = createScope(scope);
				var tokens = path.split("/");
				var prefix = (tokens.length > 1) ? tokens.slice(0,tokens.length-1).join("/") + "/" : "";
				inner.$loader = (p.Loader) ? new p.Loader(prefix) : new Child(prefix);
				if (path == "" || /\/$/.test(path)) {
					path += "module.js";
				}
				runWith.call(target,p.getCode(path),inner);
				return inner.$exports;
			}
		}

		this.run = function(code,scope,target) {
			runWith.call(target,code,scope);
		};

		//	TODO	For file and module, what should we do about 'this' and why?

		this.file = function(code,scope,target) {
			return file.call(target,code,scope);
		};

		this.module = function(p,scope) {
			var loader = new Loader(p);
			return loader.module(p.main,scope);
		};

		this.Loader = Loader;

		this.namespace = function(string) {
			//	This construct returns the top-level global object, e.g., window in the browser
			var global = function() {
				return this;
			}();

			var scope = global;
			if (string) {
				var tokens = string.split(".");
				for (var i=0; i<tokens.length; i++) {
					if (typeof(scope[tokens[i]]) == "undefined") {
						scope[tokens[i]] = {};
					}
					scope = scope[tokens[i]];
				}
			}
			return scope;
		}

		if ($platform.java) {
			this.java = $platform.java;
		}

		//	TODO	The following properties must be exposed to the Rhino loader so that it can supply them to jsh/unit jsapi via
		//			jsh.js

		//	TODO	also used by client.html unit tests
		this.$platform = $platform;

		//	TODO	also used by client.html unit tests
		//	used to allow implementations to set warnings for deprecate and experimental
		this.$api = $api;
	};
})()