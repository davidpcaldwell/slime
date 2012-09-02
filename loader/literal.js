//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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

		var $api = (function() {
			var $exports = {};

			var flag = function() {
				var rv = function(object,property) {
					var reason = arguments.callee;

					if ( (typeof(object) == "object" || typeof(object) == "function") && typeof(property) == "string" ) {
					} else if (typeof(object) == "function" && typeof(property) == "undefined") {
					} else {
						if (reason.warning) {
							reason.warning({ flag: arguments });
						} else {
							debugger;
						}
						if (arguments.length == 1) {
							//	assume first argument is supposed to be function
							return function() {
								throw new TypeError("Attempt to invoke deprecated non-existent function.");
							}
						} else {
							return function(){}();
						}
					}

					var warning = function(o) {
						if (reason.warning) {
							reason.warning(o);
						}
					}

					//	TODO	This is experimental: document it if it stays
					if (typeof(object) == "function" && arguments.length == 1) {
						var deprecateFunction = function(f) {
							var rv = function() {
								warning({ "function": f, call: arguments, reason: reason });
								return f.apply(this,arguments);
							}
							for (var x in f) {
								rv[x] = f[x];
							}
							return rv;
						}
						return deprecateFunction(arguments[0]);
					}

					//	TODO	Even in environments without accessors, we could deprecate all the functions on an object using this
					//			technique
					if (typeof(object[property]) == "function") {
						var deprecateMethod = function(f) {
							var rv = function() {
								warning({ target: object, name: property, call: arguments, reason: reason });
								//	TODO	Add regression to cover previous mistake of not returning this value (but invoking and then
								//			returning undefined)
								return f.apply(this,arguments);
							};
							for (var x in f) {
								rv[x] = f[x];
							}
							return rv;
						}
						object[property] = deprecateMethod(object[property]);
						return function(){}();
					}

					//	We only execute the rest of this method if the accessor form of defineProperty is present
					//	TODO	Make compatible with ECMA method of get/set
					if (!$platform.Object.defineProperty || !$platform.Object.defineProperty.accessor) return function(){}();

					//	If object has neither getter nor setter, we create both with versions that cooperate with one another
					//	If object has custom getter and/or custom setter, we overwrite both with versions that wrap them with warnings
					if (!object.__lookupGetter__(property) && !object.__lookupSetter__(property)) {
						var values = new function() {
							var value = object[property];

							this.set = function(v) {
								warning({ target: object, name: property, set: v, reason: reason });
								value = v;
							}

							this.get = function() {
								warning({ target: object, name: property, get: value, reason: reason });
								return value;
							}
						}
						object.__defineGetter__(property,values.get);
						object.__defineSetter__(property,values.set);
					} else {
						var wrapSetter = function(f) {
							return function(value) {
								warning({ target: object, name: property, set: value, reason: reason });
								if (f) {
									f.apply(this, [ value ]);
								}
							}
						}

						var wrapGetter = function(f) {
							return function() {
								var rv;
								if (f) {
									rv = f.apply(this, []);
								}
								warning({ target: object, name: property, get: rv, reason: reason });
								return rv;
							}
						}

						object.__defineGetter__(property,wrapGetter(object.__lookupGetter__(property)));
						object.__defineSetter__(property,wrapSetter(object.__lookupSetter__(property)));
					}
					return function(){}();
				}
				return rv;
			}

			var deprecate = flag();
			var experimental = flag();

			$exports.deprecate = deprecate;
			$exports.experimental = experimental;

			return $exports;
		})();

		var runInScope = function(code,scope,target) {
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
					(arguments[2]) ? arguments[2] : {},
					arguments
				);
			};

			var runScope = function(initial) {
				var rv = {};
				rv.$platform = $platform;
				rv.$api = $api;
				for (var x in initial) {
					rv[x] = initial[x];
				}
				return rv;
			}

			var fixed = runScope(scope);

			if (typeof(code) == "function") {
				//	it is a function that can execute the code given a scope and target object
				code(fixed,target);
			} else if (typeof(code) == "string") {
				run(code,fixed,target);
			} else {
				throw "Unimplemented: typeof(code) = " + typeof(code);
			}
		}

		var file = function(code,$context) {
			var scope = {
				$exports: {}
			};
			scope.$context = ($context) ? $context : {};
			runInScope(code,scope,{});
			return scope.$exports;
		}

		var Loader = function(p) {
			var getCode = p.getCode;
			var decorateLoader = p.decorateLoader;
			var Callee = arguments.callee;

			this.run = function(path,scope,target) {
				runInScope(getCode(path),scope,target);
			}

			var createScope = function(scope) {
				var rv;
				if (scope && (scope.$context || scope.$exports)) {
					rv = scope;
				} else {
					rv = { $context: scope };
				}
				if (!rv.$exports) {
					rv.$exports = {};
				}
				return rv;
			}

			this.file = function(path,scope,target) {
				//	TODO	can we put file in here somehow?
				//	TODO	should we be able to provide a 'this' here?
				var inner = createScope(scope);
				runInScope(getCode(path),inner,target);
				return inner.$exports;
			}

			this.module = function(path,scope,target) {
				var tokens = path.split("/");
				var prefix = (tokens.length > 1) ? tokens.slice(0,tokens.length-1).join("/") + "/" : "";
				var loader = new Callee({
					getCode: function(path) {
						return getCode(prefix+path);
					},
					decorateLoader: decorateLoader
				});
				var inner = createScope(scope);
				inner.$loader = loader;
				runInScope(getCode(path),inner,target);
				return inner.$exports;
			}

			if (decorateLoader) {
				decorateLoader(this);
			}
		}

		this.run = function(code,scope,target) {
			runInScope(code,scope,target);
		};

		//	TODO	For file and module, what should we do about 'this' and why?

		this.file = function(code,$context) {
			return file(code,$context);
		};

		this.module = function(format,scope) {
			var loader = new Loader(format);
			return loader.module(format.main,scope);
		};

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
