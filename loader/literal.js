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

			$exports.execute = (function() {
				if (typeof($engine) != "undefined" && $engine.execute) return $engine.execute;
				return function(/*script,scope,target*/) {
					return (function() {
						//	$platform and $api are in scope
						with( arguments[1] ) {
							eval(arguments[0]);
						}
					}).call(
						arguments[2],
						arguments[0].code, arguments[1]
					);
				}
			})();

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

		var $coffee = (function() {
			var coffeeScript = $slime.getCoffeeScript();
			if (!coffeeScript) return null;
			if (coffeeScript.code) {
				var target = {};
				execute({ code: String(coffeeScript.code) }, {}, target);
				return target.CoffeeScript;
			} else if (coffeeScript.object) {
				return coffeeScript.object;
			}
		})();

		(function() {
			var methods = {};

			methods.run = function(resource,scope) {
				var type = (resource.type) ? String(resource.type) : null;
				if (!type) {
					if (/\.coffee$/.test(resource.name)) {
						type = "application/vnd.coffeescript";
					} else {
						type = "application/javascript";
					}
				}
				if (type == "application/vnd.coffeescript") {
					resource.js = {
						name: resource.name,
						code: $coffee.compile(resource.string)
					};
				} else if (type == "application/javascript") {
					resource.js = {
						name: resource.name,
						code: resource.string
					}
				};
				var target = this;
				var global = (function() { return this; })();
				if (scope === global) {
					scope = {};
				}
				scope.$platform = $platform;
				scope.$api = $api;
				$platform.execute(resource.js,scope,target);
			}

			var createFileScope = function($context) {
				return {
					$context: ($context) ? $context : {},
					$exports: {}
				};
			}

			methods.file = function(code,scope) {
				var inner = createFileScope(scope);
				methods.run.call(this,code,inner);
				return inner.$exports;
			};

			methods.value = function(code,scope) {
				var rv;
				if (!scope) scope = {};
				scope.$set = function(v) {
					rv = v;
				};
				methods.run.call(this,code,scope);
				return rv;
			}

			var Loader = function(p) {
				this.toString = function() {
					return p.toString();
				}

				var declare = function(name) {
					this[name] = function(path,scope,target) {
						return methods[name].call(target,p.get(path),scope);
					};
				};

				declare.call(this,"run");
				declare.call(this,"file");
				declare.call(this,"value");

				this.module = function(path,scope,target) {
					var getModuleLocations = function(path) {
						var tokens = path.split("/");
						var prefix = (tokens.length > 1) ? tokens.slice(0,tokens.length-1).join("/") + "/" : "";
						var main = path;
						if (!main || /\/$/.test(main)) {
							main += "module.js";
						}
						return {
							prefix: prefix,
							main: main
						}
					};

					var locations = getModuleLocations(path);

					var inner = createFileScope(scope);
					inner.$loader = new Child(locations.prefix);
					var script = p.get(locations.main);
					//	TODO	generalize error handling strategy; add to file, run, value
					if (!script) throw new Error("Module not found at " + locations.main);
					methods.run.call(target,script,inner);
					return inner.$exports;
				};

				var Child = (function(parent,argument) {
					return function(prefix) {
						var parameter = {
							get: function(path) {
								return argument.get(prefix + path);
							}
						};
						return new parent.constructor(parameter);
					}
				})(this,p);

				this.Child = $api.experimental(Child);

				this.source = p;
			};

			var addTopMethod = function(name) {
				this[name] = function(code,scope,target) {
					return methods[name].call(target,code,scope);
				};
			};

			addTopMethod.call(this,"run");

			//	TODO	For file, what should we do about 'this' and why?
			addTopMethod.call(this,"file");

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

			//	TODO	currently only used by jsapi in jsh/unit via jsh.js, so undocumented
			//	TODO	also used by client.html unit tests
			this.$platform = $platform;

			//	TODO	currently used to set deprecation warning in jsh.js
			//	TODO	currently used by jsapi in jsh/unit via jsh.js
			//	TODO	also used by client.html unit tests
			//	used to allow implementations to set warnings for deprecate and experimental
			this.$api = $api;
		}).call(this);
	};
})()