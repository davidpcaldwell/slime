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
	(function polyfill() {
		var ToObject = function(v) {
			//	https://www.ecma-international.org/ecma-262/6.0/#sec-toobject
			if (typeof(v) == "undefined" || v === null) throw new TypeError();
			if (typeof(v) == "boolean") return Boolean(v);
			if (typeof(v) == "number") return Number(v);
			if (typeof(v) == "string") return String(v);
			return v;
		}

		if (!Object.assign) {
			//	https://www.ecma-international.org/ecma-262/6.0/#sec-object.assign
			//	TODO	currently the basics can be tested manually with loader/test/test262.jsh.js -file local/test262/test/built-ins/Object/assign/Target-Object.js
			Object.assign = function assign(rv,firstSource /* to set function .length properly*/) {
				var rv = ToObject(arguments[0]);
				if (arguments.length == 1) return rv;
				for (var i=1; i<arguments.length; i++) {
					var source = (typeof(arguments[i]) == "undefined" || arguments[i] === null) ? {} : ToObject(arguments[i]);
					for (var x in source) {
						rv[x] = source[x];
					}
				}
				return rv;
			};
		}
	})();

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

			var global = (function() { return this; })();
			if (global.XML && global.XMLList) {
				$exports.e4x = {};
				$exports.e4x.XML = global.XML;
				$exports.e4x.XMLList = global.XMLList;
			}

			$exports.execute = (function() {
				if (typeof($engine) != "undefined" && $engine.execute) return $engine.execute;
				return function(/*script,scope,target*/) {
					return (function() {
						with( arguments[1] ) {
							return eval(arguments[0]);
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

				if (typeof($engine) != "undefined" && $engine.Object && $engine.Object.defineProperty && $engine.Object.defineProperty.setReadOnly) {
					this.Object.defineProperty.setReadOnly = $engine.Object.defineProperty.setReadOnly;
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

		var $api = $platform.execute( $slime.getLoaderScript("$api.js"), { $platform: $platform, $slime: $slime }, null);

		var mime = (function($exports) {
			$exports.Type = function(media,subtype,parameters) {
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
			};
			$exports.Type.parse = function(string) {
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
			}
			return $exports;
		})({});

		if (!$slime.flags) $slime.flags = {};

		(function() {
			mime.Type.fromName = function(path) {
				if (/\.js$/.test(path)) return mime.Type.parse("application/javascript");
				if (/\.coffee$/.test(path)) return mime.Type.parse("application/vnd.coffeescript");
				if (/\.csv$/.test(path)) return mime.Type.parse("text/csv");
			};

			var methods = {};

			var Resource = function(o) {
				if (typeof(o.read) == "function") {
					// TODO: ncdbg conditional breakpoint with above condition does not appear to work
					debugger;
					throw new Error();
				}
				if (!this.type) this.type = (function(type,name) {
					if (typeof(type) == "string") return mime.Type.parse(type);
					if (type instanceof mime.Type) return type;
					if (!type && name) {
						var fromName = mime.Type.fromName(name);
						if (fromName) return fromName;
					}
					if (!type) return null;
					throw new TypeError("Resource 'type' property must be a MIME type or string.");
				})(o.type,o.name);

				if (!this.type && o.name) {
					var nameType = mime.Type.fromName(o.name);
					if (nameType) this.type = nameType;
				}

				if (o.name) {
					this.name = o.name;
				}

				var readString = function(string) {
					return function(v) {
						if (v === String) return string;
						if (v === JSON) return JSON.parse(this.read(String));
					}
				}

				if ( (!o.read || !o.read.string) && typeof(o.string) == "string") {
					if (!o.read) o.read = {};
					o.read.string = function() {
						return o.string;
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
					this.string = o.string;
				}
			}

			//	resource.type: optional, but if it is not a recognized type, this method will error
			//	resource.name: optional, but used to determine default type if type is absent, and used for resource.js.name
			//	resource.string: optional, but used to determine code
			//	resource.js { name, code }: forcibly set based on other properties
			//	TODO	re-work resource.js

			var $coffee = (function() {
				var coffeeScript = $slime.getCoffeeScript();
				if (!coffeeScript) return null;
				if (coffeeScript.code) {
					var target = {};
					$platform.execute({ name: "coffee-script.js", code: String(coffeeScript.code) }, {}, target);
					return target.CoffeeScript;
				} else if (coffeeScript.object) {
					return coffeeScript.object;
				}
			})();

			methods.run = function run(object,scope) {
				if (!object || typeof(object) != "object") throw new TypeError("'object' must be an object, not " + object);
				if (typeof(object.read) != "function") throw new Error("Not resource.");
				var resource = object;
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
				if (type && type.is("application/vnd.coffeescript")) {
					resource.js = {
						name: resource.name,
						code: $coffee.compile(string)
					};
				} else if (type && type.is("application/javascript") || type && type.is("application/x-javascript")) {
					resource.js = {
						name: resource.name,
						code: string
					}
				};
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

			methods.value = function value(code,scope) {
				var rv;
				if (!scope) scope = {};
				scope.$set = function(v) {
					rv = v;
				};
				methods.run.call(this,code,scope);
				return rv;
			}

			var Loader = function(p) {
				if (!p.Resource) p.Resource = Resource;
				if (!p.get) {
					throw new Error("Loader argument must have a 'get' property.");
				}
				this.toString = function() {
					return p.toString();
				}

				this.source = p;

				this.get = function(path) {
					var rsource = this.source.get(path);
					if (!rsource) return rsource;
					return new p.Resource(rsource);
				};

				var declare = function(name) {
					this[name] = function retarget(path,scope,target) {
//						return methods[name].call(target,p.get(path),scope);
						return methods[name].call(target,this.get(path),scope);
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
					var script = this.get(locations.main);
					//	TODO	generalize error handling strategy; add to file, run, value
					if (!script) throw new Error("Module not found at " + locations.main);
					methods.run.call(target,script,inner);
					return inner.$exports;
				};

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
						return new parent.constructor(parameter);
					}
				})(this,p);

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
									recurse(new Child(name + "/"),m,{ path: path },callback);
								}
							}
						}
					}

					this.list = function(m) {
						if (!m) m = {};
						if (!m.filter) m.filter = function() { return true; };
						if (!m.descendants) m.descendants = function() { return false; };
						var rv = [];
						list(this,m,{ path: [] },function(entry) {
							//	TODO	switch to 'name' property
							if (entry.loader) {
								rv.push({ path: entry.path, loader: new Child(entry.path + "/") });
							} else if (entry.resource) {
								var gotten = p.get(entry.path);
								if (!gotten) throw new Error("Unexpected error: resource is " + entry.resource + " path is " + entry.path + " p is " + p);
								rv.push({ path: entry.path, resource: new p.Resource(p.get(entry.path)) });
							}
						});
						return rv;
					}
				}
			};

			var addTopMethod = function(name) {
				this[name] = function(code,scope,target) {
					return methods[name].call(target,code,scope);
				};
			};

			this.mime = mime;

			addTopMethod.call(this,"run");

			//	TODO	For file, what should we do about 'this' and why?
			addTopMethod.call(this,"file");

			addTopMethod.call(this,"value");

			this.Resource = Resource;

			this.Loader = Loader;
			this.Loader.source = {};
			this.Loader.source.object = function(o) {
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
			this.Loader.series = function(list) {
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
			}

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