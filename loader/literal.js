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

		var $api = (function() {
			var $exports = {};

			var flag = function() {
				var rv = function(object,property) {
					var reason = arguments.callee;

					var warning = function(o) {
						if (reason.warning) {
							reason.warning(o);
						}
					};

					var deprecateFunction = function(f,object,property) {
						var rv = function() {
							var argument = { callee: f, target: this, arguments: Array.prototype.slice.call(arguments), reason: reason };
							if (object) {
								argument.object = object;
							}
							if (property) {
								argument.property = property;
							}
							try {
								warning(argument);
							} catch (e) {
								//	TODO	silently swallow?
							}
							//	TODO	Add regression to cover previous mistake of not returning this value (but invoking and then
							//			returning undefined)
							return f.apply(this,arguments);
						}
						for (var x in f) {
							rv[x] = f[x];
						}
						return rv;
					};
					
					var deprecateProperty = function(object,property) {
						if (typeof(object[property]) == "function") {
							object[property] = deprecateFunction(object[property],object,property);
							return;
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
									warning({ object: object, property: property, set: v, reason: reason });
									value = v;
								}

								this.get = function() {
									warning({ object: object, property: property, get: value, reason: reason });
									return value;
								}
							}
							object.__defineGetter__(property,values.get);
							object.__defineSetter__(property,values.set);
						} else {
							var wrapSetter = function(f) {
								return function(value) {
									warning({ object: object, property: property, set: value, reason: reason });
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
									warning({ object: object, property: property, get: rv, reason: reason });
									return rv;
								}
							}

							object.__defineGetter__(property,wrapGetter(object.__lookupGetter__(property)));
							object.__defineSetter__(property,wrapSetter(object.__lookupSetter__(property)));
						}						
					};
					
					if (typeof(object) == "function" && arguments.length == 1) {
						return deprecateFunction(arguments[0]);
					} else if ( (typeof(object) == "object" || typeof(object) == "function") && typeof(property) == "string") {
						//	TODO	what if property is not defined? Currently we merrily deprecate it anyway. This is probably
						//			good, as a caller may attempt to set it (perhaps it is a marker property set by callers to
						//			indicate something). But it makes it harder for us to realize when a caller tries to deprecate
						//			something that is gone.
						deprecateProperty(object,property);
					} else if (typeof(object) == "object" && object != null && arguments.length == 1) {
						//	TODO	this captures prototype properties, does it not? That may not be what we want, although it
						//			might also work just fine, by assigning the deprecated versions to the specified object,
						//			leaving the prototype intact
						//	TODO	what if object is null?
						for (var x in object) {
							deprecateProperty(object,x);
						}
					} else {
						//	Tried to deprecate something that did not exist, apparently
						warning({
							flag: Array.prototype.slice.call(arguments),
							reason: reason
						});
						//	Return a function; if caller was trying to deprecate an object, caller will be expecting return value
						//	to be undefined so will probably ignore it; if caller was trying to deprecate a function, caller will
						//	get this back.
						return function() {
							throw new TypeError("Attempt to invoke deprecated non-existent function.");
						};
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

		var file = function(code,scope,target) {
			//	TODO	can we put file in here somehow?
			//	TODO	should we be able to provide a 'this' here?
			var inner = createScope(scope);
			runInScope(code,inner,target);
			return inner.$exports;
		}

		var Loader = function(p) {
			var Callee = arguments.callee;

			this.run = function(path,scope,target) {
				runInScope(p.getCode(path),scope,target);
			}

			this.file = function(path,scope,target) {
				return file(p.getCode(path),scope,target);
			}

			//	Creates a child loader that prepends the given prefix
			var Child = function(path) {
				var tokens = path.split("/");
				var prefix = (tokens.length > 1) ? tokens.slice(0,tokens.length-1).join("/") + "/" : "";
				if (p.createChild) {
					return p.createChild(prefix);
				} else {
					return new Callee({
						getCode: function(path) {
							return p.getCode(prefix+path);
						}
					})
				}
			}

			this.Child = Child;

			this.module = function(path,scope,target) {
				var inner = createScope(scope);
				inner.$loader = new Child(path);
				if (path == "" || /\/$/.test(path)) {
					path += "module.js";
				}
				runInScope(p.getCode(path),inner,target);
				return inner.$exports;
			}
		}

		this.Loader = Loader;

		this.run = function(code,scope,target) {
			runInScope(code,scope,target);
		};

		//	TODO	For file and module, what should we do about 'this' and why?

		this.file = function() {
			return file.apply(this,arguments);
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