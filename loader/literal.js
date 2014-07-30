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

		var run = function(/*script*/) {
			return (function() {
				//	$platform and $api are in scope
				with( arguments[0].scope ) {
					eval(arguments[0].code);
				}
			}).call(
				arguments[0].target,
				{ scope: arguments[0].scope, code: arguments[0].code }
			);
		};
		
		var $coffee = (function() {
			var coffeeScript = $slime.getCoffeeScript();
			if (!coffeeScript) return null;
			if (coffeeScript.code) {
				var target = {};
				run({
					code: String(coffeeScript.code),
					target: target,
					scope: {}
				});
				return target.CoffeeScript;
			} else if (coffeeScript.object) {
				return coffeeScript.object;
			}
		})();

		(function() {
			var preprocess;
			
			var runWith = function(script,scope) {
				if (preprocess) {
					preprocess(script);
				}
				script.target = this;
				script.scope = scope;
				script.scope.$platform = $platform;
				script.scope.$api = $api;
				if ($coffee && /\.coffee$/.test(script.name)) {
					script.code = $coffee.compile(script.code);
				}
				run(script);
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
			this.run.spi = {};
			this.run.spi.preprocess = function(implementation) {
				preprocess = implementation(preprocess);
			};
			this.run.spi.execute = function(implementation) {
				run = implementation(run);
			};

			//	TODO	For file and module, what should we do about 'this' and why?

			this.file = function(code,scope,target) {
				return file.call(target,code,scope);
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