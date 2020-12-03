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
	 * @param { slime.runtime.$slime } $slime
	 * @returns { slime.runtime.Exports }
	 */
	function($engine,$slime) {
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
					value: function assign(rv,firstSource /* to set function .length properly*/) {
						var rv = ToObject(arguments[0]);
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
		 * @type { $api.internal.$platform }
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

		var mime = (
			/**
			 * @param { slime.runtime.Exports["mime"] } $exports
			 */
			function($exports) {
				$exports.Type = Object.assign(
					/**
					 * @param {string} media
					 * @param {string} subtype
					 * @param { { [x: string]: string } } parameters
					 */
					function(media,subtype,parameters) {
						$api.Function.argument.isString({ index: 0, name: "media" }).apply(this,arguments);
						$api.Function.argument.isString({ index: 1, name: "subtype" }).apply(this,arguments);
						(function() {
							if (typeof(arguments[2]) != "object" && typeof(arguments[2]) != "undefined") {
								throw new TypeError("arguments[2] (parameters) must be undefined or object");
							}
						}).apply(this,arguments);

						this.getMedia = function() {
							return media;
						}

						this.getSubtype = function() {
							return subtype;
						}

						this.getParameters = function() {
							return parameters;
						}

						this.is = function(string) {
							return string == media + "/" + subtype;
						}

						this.toString = function() {
							var rv = media + "/" + subtype;
							for (var x in parameters) {
								rv += ";" + x + "=\"" + parameters[x] + "\"";
							}
							return rv;
						}
					},
					{
						parse: function(string) {
							if (string === null) return null;
							//	First parse RFC 822 header; see RFC 822 section 3.2 http://tools.ietf.org/html/rfc822#section-3.2
							var collapser = /^(.*)(?:\r\n| |\t){2,}(.*)/;
							while(collapser.test(string)) {
								var match = collapser.exec(string);
								string = match[1] + " " + match[2];
							}
							var slash = string.indexOf("/");
							var media = string.substring(0,slash);
							string = string.substring(slash+1);
							var semicolon = string.indexOf(";");
							var subtype;
							var parameters;
							if (semicolon == -1) {
								subtype = string;
								string = "";
								parameters = {};
							} else {
								subtype = string.substring(0,semicolon);
								string = string.substring(semicolon);
								parameters = {};
								var more = true;
								while(more) {
									//	First, get rid of the semicolon
									if (string.substring(0,1) != ";") {
										throw new Error();
									} else {
										string = string.substring(1);
									}
									//	Then, get rid of whitespace
									var wsmatcher = /^\s+(.*)/;
									if (wsmatcher.test(string)) {
										string = wsmatcher.exec(string)[1];
									}
									var nvmatch = /(.*?)\=(.*)/.exec(string);
									var name = nvmatch[1];
									var rest = nvmatch[2];
									var value = "";
									if (rest.substring(0,1) == "\"") {
										rest = rest.substring(1);
										while(rest.substring(0,1) != "\"") {
											value += rest.substring(0,1);
											rest = rest.substring(1);
										}
										string = rest.substring(1);
									} else {
										while(rest.length > 0 && rest.substring(0,1) != ";") {
											value += rest.substring(0,1);
											rest = rest.substring(1);
										}
										string = rest;
									}
									parameters[name] = value;
									more = (string.length > 0);
								}
								var codes = [];
								for (var i=0; i<string.length; i++) {
									codes.push(string.charCodeAt(i));
								}
								//	loop
							}
							var rv = new $exports.Type(media,subtype,parameters);
							return rv;
						},
						fromName: void(0)
					}
				);
				return $exports;
			}
		)({ Type: void(0) });

		/** @type { slime.runtime.Exports["mime"]["Type"]["fromName"] } */
		mime.Type.fromName = function(path) {
			if (/\.js$/.test(path)) return mime.Type.parse("application/javascript");
			if (/\.css$/.test(path)) return mime.Type.parse("text/css");
			if (/\.ts$/.test(path)) return mime.Type.parse("application/x.typescript");
			if (/\.csv$/.test(path)) return mime.Type.parse("text/csv");
			if (/\.coffee$/.test(path)) return mime.Type.parse("application/vnd.coffeescript");
		};

		/**
		 * @constructor
		 * @param { slime.Resource.Descriptor } o
		 */
		var Resource = function(o) {
			this.type = (function(type,name) {
				if (typeof(type) == "string") return mime.Type.parse(type);
				if (type instanceof mime.Type) return type;
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
					if ($platform.e4x && v == $platform.e4x.XML) {
						var string = this.read(String);
						string = string.replace(/\<\?xml.*\?\>/, "");
						string = string.replace(/\<\!DOCTYPE.*?\>/, "");
						return $platform.e4x.XML( string );
					} else if ($platform.e4x && v == $platform.e4x.XMLList) {
						var string = this.read(String);
						string = string.replace(/\<\?xml.*\?\>/, "");
						string = string.replace(/\<\!DOCTYPE.*?\>/, "");
						return $platform.e4x.XMLList( string );
					}
				}
			}

			//	TODO	temporary measure; some tests assume loader.get() returns resource source and so we increase compatibility between resource and its source
			if (typeof(o.string) == "string") {
				Object.defineProperty(this, "string", {
					value: o.string,
					enumerable: true
				});
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
		 * @template PSLE_T
		 * @param { PSLE_T } scope
		 * @returns { PSLE_T & { $exports: any, $export: any } }
		 */
		var toExportScope = function(scope) {
			/** @type { PSLE_T & { $exports: any, $export: any } } */
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

		var createFileScope = function($context) {
			return toExportScope({
				$context: ($context) ? $context : {}
			});
		}

		/** @returns { slime.runtime.Exports } */
		var Exports = function() {

			var methods = {};

			/**
			 * @constructor
			 * @param { ConstructorParameters<slime.runtime.Exports["Loader"]>[0] } p
			 */
			var Loader = function(p) {
				if (!p.get) throw new TypeError("Loader argument must have a 'get' property.");

				if (!p.Resource) p.Resource = Resource;

				this.toString = function() {
					return p.toString();
				}

				this.source = p;

				/** @type { slime.Loader["get"] } */
				this.get = function(path) {
					var rsource = this.source.get(path);
					if (!rsource) return null;
					return new p.Resource(rsource);
				};

				/**
				 * @this { slime.Loader }
				 * @param { string } name
				 */
				var declare = function(name) {
					this[name] = (
						/**
						 * @param { string } path
						 * @param { any } context
						 * @param { any } target
						 */
						function retarget(path,context,target) {
							// return methods[name].call(target,p.get(path),scope);
							var resource = this.get(path);
							if (!resource) throw new Error("Not found: " + path);
							return methods[name].call(target,resource,context);
						}
					);
				};

				/** @type { slime.Loader["run"] } */
				this.run = void(0);
				/** @type { slime.Loader["value"] } */
				this.value = void(0);
				/** @type { slime.Loader["file"] } */
				this.file = void(0);
				declare.call(this,"run");
				declare.call(this,"value");
				declare.call(this,"file");

				/** @type { slime.Loader["module"] } */
				this.module = function(path,$context,target) {
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

					/** @type { slime.Loader.Scope } */
					var inner = createFileScope($context);
					inner.$loader = Child(locations.prefix);
					var script = this.get(locations.main);
					//	TODO	generalize error handling strategy; add to file, run, value
					if (!script) throw new Error("Module not found at " + locations.main);
					methods.run.call(target,script,inner);
					return inner.$exports;
				};

				/** @type { slime.Loader["factory"] } */
				this.factory = function(path) {
					var $loader = this;
					return function(c) {
						return $loader.module(path, c);
					}
				}

				var Child = (function(parent,argument) {
					return function(prefix) {
						//	TODO	should we short-circuit if prefix is empty string?
						if (prefix && prefix.substring(prefix.length-1) != "/") throw new Error("Prefix not ending with /");
						var parameter = (p.child) ? p.child(prefix) : {
							toString: function() {
								return "Child [" + prefix + "] of " + argument.toString();
							},
							get: function(path) {
								return argument.get(prefix + path);
							},
							list: (p.list) ? function(given) {
								if (given) {
									var slash = given.substring(given.length-1);
									if (slash != "/") {
										throw new Error("Given list path not ending with /: " + given)
									}
								}
								var nowprefix = (given) ? prefix + given : prefix;
								return p.list(nowprefix);
							} : null
						};

						/**
						 * @returns { new (p: any) => slime.Loader }
						 */
						var castToConstructor = function(v) {
							return v;
						}
						var ParentConstructor = castToConstructor(parent.constructor);
						return new ParentConstructor(parameter);
					}
				})(this,p);

				/** @type { slime.Loader["Child"] } */
				this.Child = $api.experimental(Child);

				if (p.list) {
					var list = function recurse(loader,m,context,callback) {
						var all = loader.source.list("");
						for (var i=0; i<all.length; i++) {
							var path = context.path.slice();
							var name = all[i].path;
							path.push(name);
							if (m.filter(all[i])) {
								var arg = {};
								for (var x in all[i]) {
									arg[x] = all[i][x];
								}
								arg.path = path.join("/");
								callback(arg);
							}
							if (all[i].loader) {
								if (m.descendants(all[i])) {
									recurse(Child(name + "/"),m,{ path: path },callback);
								}
							}
						}
					}

					/** @type { slime.Loader["list"] } */
					this.list = function(m) {
						if (!m) m = {};
						if (!m.filter) m.filter = function() { return true; };
						if (!m.descendants) m.descendants = function() { return false; };
						var rv = [];
						list(
							this,
							m,
							{ path: [] },
							/**
							 * @param { { path: string, loader: boolean, resource: boolean } } entry
							 */
							function(entry) {
								//	TODO	switch to 'name' property
								if (entry.loader) {
									rv.push({ path: entry.path, loader: Child(entry.path + "/") });
								} else if (entry.resource) {
									var gotten = p.get(entry.path);
									if (!gotten) throw new Error("Unexpected error: resource is " + entry.resource + " path is " + entry.path + " p is " + p);
									rv.push({ path: entry.path, resource: new p.Resource(p.get(entry.path)) });
								}
							}
						);
						return rv;
					}
				}
			};

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
				var type = resource.type;
				if (!type) type = mime.Type.parse("application/javascript");
				var string = (function() {
					if (resource.read) {
						var rv = resource.read(String);
						if (typeof(rv) == "string") return rv;
					}
				})();
				if (typeof(string) != "string") {
					throw new TypeError("Resource: " + resource.name + " is not convertible to string, so cannot be executed.");
				}
				if ($slime.typescript && type && type.is("application/x.typescript")) {
					resource.js = {
						name: resource.name,
						code: $slime.typescript.compile(string)
					};
				} else if (type && type.is("application/vnd.coffeescript")) {
					resource.js = {
						name: resource.name,
						code: $coffee.compile(string)
					};
				} else if (type && type.is("application/javascript") || type && type.is("application/x-javascript")) {
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

			var export_Loader = Object.assign(Loader, { source: void(0), series: void(0), tools: void(0) });
			export_Loader.source = {};
			export_Loader.source.object = function(o) {
				var getLocation = function(path) {
					var target = o;
					var tokens = path.split("/");
					for (var i=0; i<tokens.length-1; i++) {
						target = target[tokens[i]].loader;
						if (!target) return null;
					}
					return {
						loader: target,
						path: tokens[tokens.length-1]
					};
				};

				this.get = function(path) {
					//	TODO	should not return directories
					var location = getLocation(path);
					return (location) ? location.loader[location.path].resource : null;
				};

				this.list = function(path) {
					var location = getLocation(path);
					if (location.path) throw new Error("Wrong path: [" + path + "]");
					var rv = [];
					for (var x in location.loader) {
						rv.push({
							path: x,
							loader: Boolean(location.loader[x].loader),
							resource: Boolean(location.loader[x].resource)
						});
					}
					return rv;
				}
			};
			export_Loader.series = function(list) {
				var sources = [];
				for (var i=0; i<list.length; i++) {
					sources[i] = list[i].source;
				}
				var source = new function() {
					this.get = function(path) {
						for (var i=0; i<sources.length; i++) {
							var rv = sources[i].get(path);
							if (rv) return rv;
						}
						return null;
					}
				}
				return new Loader(source);
			};
			export_Loader.tools = {
				toExportScope: toExportScope
			};

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
)($engine,$slime)