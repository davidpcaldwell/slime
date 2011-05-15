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

new function() {
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
					var rv = Packages[name];
					if (typeof(rv) == "function") return rv;
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
				this.Object.defineProperty.setReadOnly = $engine.Object.defineProperty.setReadOnly;
			} catch (e) {
			}
		}).call($exports);

		try {
			if ($engine.MetaObject) {
				$exports.MetaObject = $engine.MetaObject;
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
				//	TODO	If we allowed arguments.callee.warning to be used, we could do different reasons for different problems
				//	var warning = ($context.flag && $context.flag.warning) ? $context.flag.warning : function() {};
				var warning = function(o) {
					if (reason.warning) {
						reason.warning(o);
					}
				}

				//	TODO	This is experimental: document it if it stays
				if (typeof(object) == "function" && arguments.length == 1) {
					var deprecateFunction = function(f) {
						return function() {
							warning({ "function": f, call: arguments, reason: reason });
							return f.apply(this,arguments);
						}
					}
					return deprecateFunction(arguments[0]);
				}

				//	TODO	Even in environments without accessors, we could deprecate all the functions on an object using this
				//			technique
				if (typeof(object[property]) == "function") {
					var deprecateMethod = function(f) {
						return function() {
							warning({ target: object, name: property, call: arguments, reason: reason });
							//	TODO	Add regression to cover previous mistake of not returning this value (but invoking and then
							//			returning undefined)
							return f.apply(this,arguments);
						}
					}
					object[property] = deprecateMethod(object[property]);
					return function(){}();
				}

				if ($platform && $platform.Object.defineProperty && $platform.Object.defineProperty.accessor) {
				} else {
					return function(){}();
				}

				//	If object has neither getter nor setter, we create both with versions that cooperate with one another
				//	If object has custom getter and/or custom setter, we overwrite both with versions that wrap them with warnings

				//	TODO	Make compatible with ECMA method of get/set
				if (!$platform.Object.defineProperty || !$platform.Object.defineProperty.accessor) return function(){}();

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

		//	TODO	Examine the below, copied-and-pasted from js/object where it was also commented out

		//if ($platform && $platform.Object.defineProperty && $platform.Object.defineProperty.accessor) {
		//	//	TODO	This likely now fails tests in Internet Explorer because it will attempt to run them even though deprecation
		//	//			has no effect
		//	$exports.deprecate = deprecate;
		//} else {
		//	$exports.deprecate = function() {
		//		if (arguments.length == 1 && typeof(arguments[0]) == "function") {
		//			return deprecate.apply(this,arguments);
		//		} else if (arguments.length == 2 && typeof(arguments[0]) == "object" && typeof(arguments[1]) == "string" 
		//			&& typeof(arguments[0][arguments[1]]) == "function") 
		//		{
		//			return deprecate.apply(this,arguments);
		//		}
		//		return function(){}();
		//	};
		//}

		$exports.deprecate = deprecate;
		$exports.experimental = experimental;

		return $exports;
	})();

	//	TODO	The following properties must be exposed to the Rhino loader so that it can supply them to jsh/unit jsapi via jsh.js
	
	//	TODO	also used by client.html unit tests
	this.$platform = $platform;

	//	TODO	also used by client.html unit tests
	this.$api = $api;

	var runners = new function() {
		this.run = function(/*code,scope*/) {
			//	TODO	check to understand exactly what leaks into namespace. Does 'runners' for example? 'runScope'? ModuleLoader?
			//	TODO	putting $exports: true as a property of 'this' is designed to allow older modules to know they are being
			//			loaded by the new loader, and should go away when all modules are converted
			return (function() {
				//	$platform is in scope because of the above
				//	$api is also in scope				
				with( arguments[1] ) {
					eval(arguments[0]);
				}
				return arguments[1].$exports;
			}).apply({ $exports: true },arguments);
		}
	}
	
	var runInScope = function(code,scope) {
		var runScope = function(initial) {
			var rv = {};
			rv.$platform = $platform;
			rv.$api = $api;
			for (var x in initial) {
				rv[x] = initial[x];
			}
			if (!rv.$context) rv.$context = {};
			if (!rv.$exports) rv.$exports = {};
			return rv;
		}
		
		var fixed = runScope(scope);

		if (typeof(code) == "function") {
			//	assume it is a function that can execute the code given a scope
			code(fixed);
		} else if (typeof(code) == "string") {
			runners.run(code,fixed);			
		} else {
			throw "Unimplemented: typeof(code) = " + typeof(code);
		}		
		return fixed.$exports;
	}
	
	var runWithContext = function(code,$context) {
		return runInScope(code,{ $context: $context });
	}
	
	var ModuleLoader = function(format) {
		//	format.getCode: function(path), returns string containing the code contained at that path
		//	format.main: string, path to module file

		var Callee = arguments.callee;

		this.load = function(configuration) {
			return runInScope(
				format.getCode(format.main),
				{
					$context: (configuration && configuration.$context) ? configuration.$context : {},
					$exports: (configuration && configuration.$exports) ? configuration.$exports : {},
					$loader: new function() {
						this.script = function(path,context) {
							return runWithContext(format.getCode(path),context);
						}

						this.module = function(path,context) {
							var tokens = path.split("/");
							var prefix = (tokens.length > 1) ? tokens.slice(0,tokens.length-1).join("/") + "/" : "";
							var main = tokens[tokens.length-1];
							var loader = new Callee({
								main: main,
								getCode: function(path) {
									return format.getCode(prefix+path);
								}
							});
							return loader.load({ $context: context });
						}
					}()
				}
			);
		}
	}

	this.module = function(format,scope) {
		var loader = new ModuleLoader(format);
		return loader.load(scope);
	};

	this.script = function(code,scope) {
		return runInScope(code,scope);
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
}