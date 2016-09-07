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

		(function() {
			mime.Type.fromName = function(path) {
				if (/\.js$/.test(path)) return mime.Type.parse("application/javascript");
				if (/\.coffee$/.test(path)) return mime.Type.parse("application/vnd.coffeescript");
				if (/\.csv$/.test(path)) return mime.Type.parse("text/csv");
			};

			var methods = {};

			//	resource.type: optional, but if it is not a recognized type, this method will error
			//	resource.name: optional, but used to determine default type if type is absent, and used for resource.js.name
			//	resource.string: optional, but used to determine code
			//	resource.js { name, code }: forcibly set based on other properties
			//	TODO	re-work resource.js
			methods.run = function(resource,scope) {
				if (!resource || typeof(resource) != "object") throw new TypeError("'resource' must be an object, not " + resource);
				var type = (function(v) {
					if (typeof(v) == "string") return mime.Type.parse(v);
					if (v instanceof mime.Type) return v;
					if (!v) return null;
					throw new TypeError("Resource 'type' property must be a MIME type or string.");
				})(resource.type);
				if (!type) {
					type = mime.Type.fromName(resource.name);
					if (!type) {
						type = mime.Type.parse("application/javascript");
					}
				}
				if (type && type.is("application/vnd.coffeescript")) {
					resource.js = {
						name: resource.name,
						code: $coffee.compile(resource.string)
					};
				} else if (type && type.is("application/javascript")) {
					resource.js = {
						name: resource.name,
						code: resource.string
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
				if (!p.get) {
					throw new Error("Loader argument must have a 'get' property.");
				}
				this.toString = function() {
					return p.toString();
				}

				this.source = p;

				this.get = function(path) {
					return this.source.get(path);
				};

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
						var parameter = (p.child) ? p.child(prefix) : {
							get: function(path) {
								return argument.get(prefix + path);
							},
							list: (p.list) ? function(wasprefix) {
								var nowprefix = (wasprefix) ? wasprefix + "/" + prefix : prefix;
								return p.list(nowprefix);
							} : null
						};
						return new parent.constructor(parameter);
					}
				})(this,p);

				this.Child = $api.experimental(Child);

				var list = function(loader,m,context,callback) {
					var all = loader.source.list();
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
								list(new Child(name),m,{ path: path },callback);
							}
						}
					}
				}

				if (p.list) {
					this.list = function(m) {
						if (!m) m = {};
						if (!m.filter) m.filter = function() { return true; };
						if (!m.descendants) m.descendants = function() { return false; };
						var rv = [];
						list(this,m,{ path: [] },function(entry) {
							//	TODO	switch to 'name' property
							if (entry.loader) {
								rv.push({ path: entry.path, loader: new Child(entry.path) });
							} else if (entry.resource) {
								rv.push({ path: entry.path, resource: p.get(entry.path) });
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

			this.Loader = Loader;
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