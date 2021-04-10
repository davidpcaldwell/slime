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

//@ts-check
(
	/**
	 * @param { slime.runtime.$engine | undefined } $engine
	 * @param { slime.runtime.$slime.Deployment } $slime
	 * @param { slime.jrunscript.Packages } Packages - note that in the rare case of a browser with Java, Packages may not include inonit.* classes
	 * @returns { slime.runtime.Exports }
	 */
	function($engine,$slime,Packages) {
		(function polyfill() {
			var ToObject = function(v) {
				//	https://www.ecma-international.org/ecma-262/6.0/#sec-toobject
				if (typeof(v) == "undefined" || v === null) throw new TypeError("ToObject() cannot be invoked with argument " + v);
				if (typeof(v) == "boolean") return Boolean(v);
				if (typeof(v) == "number") return Number(v);
				if (typeof(v) == "string") return String(v);
				return v;
			}

			if (!Object.assign) {
				//	https://www.ecma-international.org/ecma-262/6.0/#sec-object.assign
				//	TODO	currently the basics can be tested manually with loader/test/test262.jsh.js -file local/test262/test/built-ins/Object/assign/Target-Object.js
				Object.defineProperty(Object, "assign", {
					value: function assign(target,firstSource /* to set function .length properly*/) {
						var rv = ToObject(target);
						if (arguments.length == 1) return rv;
						for (var i=1; i<arguments.length; i++) {
							var source = (typeof(arguments[i]) == "undefined" || arguments[i] === null) ? {} : ToObject(arguments[i]);
							for (var x in source) {
								rv[x] = source[x];
							}
						}
						return rv;
					},
					writable: true,
					configurable: true
				});
			}

			if (!Object.fromEntries) {
				Object.defineProperty(Object, "fromEntries", {
					value: function(iterable) {
						if (iterable instanceof Array) {
							var rv = {};
							iterable.forEach(function(item) {
								rv[item[0]] = item[1];
							});
							return rv;
						} else {
							throw new TypeError("'iterable' must currently be an array");
						}
					}
				});
			}

			if (!Object.entries) {
				Object.defineProperty(Object, "entries", {
					value: function(object) {
						var rv = [];
						for (var x in object) {
							rv.push([x, object[x]]);
						}
						return rv;
					}
				});
			}

			if (!Array.prototype.find) {
				Object.defineProperty(Array.prototype, "find", {
					value: function(f, target) {
						for (var i=0; i<this.length; i++) {
							var match = f.call(target, this[i], i, this);
							if (match) return this[i];
						}
					},
					configurable: true,
					writable: true
				});
			}
		})();

		/**
		 * @type { slime.$api.internal.$platform }
		 */
		var $$platform = {
			Error: {
				decorate: ($engine && $engine.Error) ? $engine.Error.decorate : void(0)
			},
			execute: (function() {
				if ($engine && $engine.execute) return $engine.execute;
				return function(/*script{name,code},scope,target*/) {
					return (function() {
						//@ts-ignore
						with( arguments[1] ) {
							return eval(arguments[0]);
						}
					}).call(
						arguments[2],
						arguments[0].js, arguments[1]
					);
				}
			})()
		}

		var $platform = (function() {
			/** @type { slime.runtime.$platform } */
			var $exports = {};
			$exports.Object = {};
			if (Object.defineProperty) {
				$exports.Object.defineProperty = { ecma: true };
			}
			if (Object.prototype.__defineGetter__) {
				if (!$exports.Object.defineProperty) $exports.Object.defineProperty = {};
				$exports.Object.defineProperty.accessor = true;
			}

			var global = (function() { return this; })();
			if (global.XML && global.XMLList) {
				$exports.e4x = {};
				$exports.e4x.XML = global.XML;
				$exports.e4x.XMLList = global.XMLList;
			}

			(
				/**
				 * @this { slime.runtime.$platform }
				 */
				function() {
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
				}
			).call($exports);

			try {
				if (typeof($engine) != "undefined") {
					if ($engine.MetaObject) {
						$exports.MetaObject = $engine.MetaObject;
					}
				}
			} catch (e) {
				//	MetaObject will not be defined
			}

			//	TODO	get rid of this, but right now tests don't pass without it
			$exports.execute = $$platform.execute;

			return $exports;
		})();

		var $api = $$platform.execute(
			$slime.getRuntimeScript("$api.js"),
			{
				$platform: $$platform,
				$slime: {
					getRuntimeScript: function(path) {
						return $slime.getRuntimeScript(path);
					}
				}
			},
			null
		);

		var load = function(path,scope) {
			/** @type { any } */
			var exported;

			$$platform.execute(
				$slime.getRuntimeScript(path),
				Object.assign(scope, {
					$export: function(value) {
						exported = value;
					}
				}),
				null
			);

			return exported;
		}

		/** @type { slime.runtime.internal.mime } */
		var mimeExports = load(
			"mime.js",
			{
				$api: $api
			}
		);

		var mime = {
			/** @type { slime.runtime.Exports["mime"]["Type"] } */
			Type: mimeExports.Type
		};

		var mimeTypeIs = mimeExports.mimeTypeIs;

		/**
		 * @param { ConstructorParameters<slime.resource.Factory>[0] } o
		 * @this { slime.Resource }
		 */
		function Resource(o) {
			this.type = (function(type,name) {
				if (typeof(type) == "string") return mime.Type.parse(type);
				if (type && type.media && type.subtype) return type;
				if (!type && name) {
					var fromName = mime.Type.fromName(name);
					if (fromName) return fromName;
				}
				if (!type) return null;
				throw new TypeError("Resource 'type' property must be a MIME type or string.");
			})(o.type,o.name);

			this.name = (o.name) ? o.name : void(0);

			if ( (!o.read || !o.read.string) && typeof(o.string) == "string") {
				if (!o.read) o.read = {
					string: function() {
						return o.string;
					}
				};
			}

			if (o.read && o.read.string) {
				this.read = function(v) {
					if (v === String) return o.read.string();
					if (v === JSON) return JSON.parse(this.read(String));

					var e4xRead = function() {
						var string = this.read(String);
						string = string.replace(/\<\?xml.*\?\>/, "");
						string = string.replace(/\<\!DOCTYPE.*?\>/, "");
						return string;
					};

					if ($platform.e4x && v == $platform.e4x.XML) {
						return $platform.e4x.XML( e4xRead.call(this) );
					} else if ($platform.e4x && v == $platform.e4x.XMLList) {
						return $platform.e4x.XMLList( e4xRead.call(this) );
					}
				}
			}
		}

		/** @type { slime.runtime.$slime.CoffeeScript } */
		var $coffee = (function() {
			//	TODO	rename to getCoffeescript to make consistent with camel case.
			if (!$slime.getCoffeeScript) return null;
			var coffeeScript = $slime.getCoffeeScript();
			if (!coffeeScript) return null;
			if (coffeeScript.code) {
				var target = {};
				$$platform.execute({ name: "coffee-script.js", js: String(coffeeScript.code) }, {}, target);
				return target.CoffeeScript;
			} else if (coffeeScript.object) {
				return coffeeScript.object;
			}
		})();

		/**
		 * @type { slime.runtime.Exports["Loader"]["tools"]["toExportScope"] }
		 */
		var toExportScope = function(scope) {
			/** @type { ReturnType<slime.runtime.Exports["Loader"]["tools"]["toExportScope"]> } */
			var rv = Object.assign(scope, { $exports: void(0), $export: void(0) });
			var $exports = {};
			var $export = function(v) {
				$exports = v;
			};
			Object.defineProperty(scope, "$exports", {
				get: function() {
					return $exports;
				},
				enumerable: true
			});
			Object.defineProperty(scope, "$export", {
				get: function() {
					return $export;
				},
				enumerable: true
			});
			return rv;
		}

		/** @type { slime.runtime.internal.createFileScope } */
		var createFileScope = function($context) {
			return toExportScope({
				$context: ($context) ? $context : {}
			});
		};

		/** @returns { slime.runtime.Exports } */
		var Exports = function() {

			var methods = {};

			/** @type { slime.runtime.internal.LoaderConstructor } */
			var Loader = load("Loader.js", {
				Resource: Resource,
				methods: methods,
				createFileScope: createFileScope,
				$api: $api
			});

			//	resource.type: optional, but if it is not a recognized type, this method will error
			//	resource.name: optional, but used to determine default type if type is absent, and used for resource.js.name
			//	resource.string: optional, but used to determine code
			//	resource.js { name, code }: forcibly set based on other properties
			//	TODO	re-work resource.js

			/**
			 * @param { slime.Resource } object
			 * @param { any } scope
			 */
			methods.run = function run(object,scope) {
				if (!object || typeof(object) != "object") {
					throw new TypeError("'object' must be an object, not " + object);
				}
				if (typeof(object.read) != "function") throw new Error("Not resource.");
				/** @type { slime.Resource & { js: { name: string, code: string } } } */
				var resource = Object.assign(object, { js: void(0) });
				var type = (resource.type) ? mime.Type(resource.type.media, resource.type.subtype, resource.type.parameters) : mime.Type.parse("application/javascript");
				var string = (function() {
					if (resource.read) {
						var rv = resource.read(String);
						if (typeof(rv) == "string") return rv;
					}
				})();
				if (typeof(string) != "string") {
					throw new TypeError("Resource: " + resource.name + " is not convertible to string, so cannot be executed.");
				}

				var typeIs = function(string) {
					return type && mimeTypeIs(string)(type);
				}

				if ($slime.typescript && typeIs("application/x.typescript")) {
					resource.js = {
						name: resource.name,
						code: $slime.typescript.compile(string)
					};
				} else if (typeIs("application/vnd.coffeescript")) {
					resource.js = {
						name: resource.name,
						code: $coffee.compile(string)
					};
				} else if (typeIs("application/javascript") || typeIs("application/x-javascript")) {
					resource.js = {
						name: resource.name,
						code: string
					}
				}
				if (!resource.js) {
					throw new TypeError("Resource " + resource.name + " is not JavaScript; type = " + type);
				}
				var target = this;
				var global = (function() { return this; })();
				//	TODO	why is this present?
				if (scope === global) {
					scope = {};
				}
				if (scope === void(0)) {
					scope = {};
				}
				scope.$platform = $platform;
				scope.$api = $api;
				$$platform.execute(
					{
						name: resource.js.name,
						js: resource.js.code
					},
					scope,
					target
				);
			}

			/**
			 * @param { slime.Resource & { js: { name: string, js: string } } } code
			 * @param { any } $context
			 */
			methods.file = function(code,$context) {
				var inner = createFileScope($context);
				methods.run.call(this,code,inner);
				return inner.$exports;
			};

			/**
			 * @param { slime.Resource & { js: { name: string, js: string } } } code
			 * @param { any } scope
			 */
			methods.value = function value(code,scope) {
				var rv;
				if (!scope) scope = {};
				scope.$set = function(v) {
					rv = v;
				};
				methods.run.call(this,code,scope);
				return rv;
			}

			var topMethod = function(name) {
				return function(code,scope,target) {
					return methods[name].call(target,code,scope);
				};
			};

			var loaders = load(
				"loaders.js",
				{
					toExportScope: toExportScope,
					Loader: Loader
				}
			)


			var export_Loader = Object.assign(
				Loader,
				loaders
			);

			var export_namespace = function(string) {
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

			var rv = Object.assign({},
				{
					mime: mime,
					run: topMethod("run"),
					file: topMethod("file"),
					value: topMethod("value"),
					Resource: Resource,
					Loader: export_Loader,
					loader: {
						source: {
							object: export_Loader.source.object
						}
					},
					namespace: export_namespace,
					//	TODO	currently only used by jsapi in jsh/unit via jsh.js, so undocumented
					//	TODO	also used by client.html unit tests
					$platform: $platform
				},
				($platform.java) ? { java: $platform.java } : {},
				{
					//	TODO	currently used to set deprecation warning in jsh.js
					//	TODO	currently used by jsapi in jsh/unit via jsh.js
					//	TODO	also used by client.html unit tests
					//	used to allow implementations to set warnings for deprecate and experimental
					$api: $api
				},
				{
					typescript: void(0)
				}
			);
			Object.defineProperty(rv, "typescript", {
				get: function() {
					return $slime.typescript;
				},
				enumerable: true
			});
			return rv;
		};

		return Exports();
	}
//@ts-ignore
)($engine,$slime,Packages)
