//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.runtime.internal.old_loaders.Scope["toExportScope"] } toExportScope
	 * @param { slime.runtime.internal.old_loaders.Scope["Resource"] } Resource
	 * @param { slime.runtime.internal.old_loaders.Scope["createScriptScope"] } createScriptScope
	 * @param { slime.runtime.internal.old_loaders.Scope["methods"] } methods
	 * @param { slime.loader.Export<slime.runtime.internal.old_loaders.Exports> } $export
	 */
	function($api,toExportScope,Resource,createScriptScope,methods,$export) {
		/** @type { slime.$api.fp.Mapping<slime.Resource,slime.runtime.loader.Code> } */
		var adaptResource = function(object) {
			/** @type { slime.Resource & { js: { name: string, code: string } } } */
			var resource = Object.assign(object, { js: void(0) });
			var type = (resource.type) ? resource.type : $api.mime.Type.codec.declaration.decode("application/javascript");
			var string = (function() {
				if (resource.read) {
					var rv = resource.read(String);
					if (typeof(rv) == "undefined") throw new Error("resource.read(String) returned undefined");
					if (typeof(rv) == "string") return rv;
					throw new Error("Not string: " + typeof(rv) + " " + rv + " using " + resource.read);
				}
			})();
			if (typeof(string) != "string") {
				throw new TypeError("Resource: " + resource.name + " is not convertible to string, it is " + typeof(string) + ", so cannot be executed. resource.read = " + resource.read);
			}
			return {
				name: resource.name,
				type: function() { return type; },
				read: function() { return string; }
			}
		};

		/** @type { (entry: slime.old.loader.Entry) => entry is slime.old.loader.ResourceEntry } */
		var isResourceEntry = function(entry) {
			return Boolean(entry["resource"]);
		}

		/**
		 * @this { slime.old.Loader }
		 * @param { slime.old.loader.Source } p
		 */
		var old = function(p) {
			if (!p.Resource) p.Resource = Resource;

			this.toString = function() {
				return p.toString();
			}

			this.source = p;

			/**
				*
				* @param { slime.resource.Descriptor } descriptor
				*/
			function get(descriptor) {
				if (!descriptor) return null;
				return new p.Resource(descriptor);
			}

			/** @type { slime.old.Loader["get"] } */
			if (p.get) this.get = function(path) {
				var rsource = this.source.get(path);
				var rv = get(rsource);
				if (rv && !rv.read) {
					throw new TypeError("source.get returned object with no read() method: source = " + this.source + " " + this.source.get + " keys = " + Object.keys(rv));
				}
				return rv;
			};

			if (p.thread) this.thread = {
				get: void(0),
				module: void(0)
			};

			if (p.thread) this.thread.get = function(path) {
				return p.thread.get(path).then(function(value) {
					return get(value)
				});
			}

			if (p.get) {
				/** @type { slime.old.Loader["run"] } */
				this.run = function retarget(path,context,target) {
					var resource = this.get(path);
					if (!resource) throw new Error("Not found: " + path + " when executing " + "run" + " in " + this);
					return methods.run.call(target,adaptResource(resource),context);
				};
				/** @type { slime.old.Loader["value"] } */
				this.value = function retarget(path,context,target) {
					var resource = this.get(path);
					if (!resource) throw new Error("Not found: " + path + " when executing " + "value" + " in " + this);
					return methods.old.value.call(target,adaptResource(resource),context);
				};
				/** @type { slime.old.Loader["file"] } */
				this.file = function retarget(path,context,target) {
					var resource = this.get(path);
					if (!resource) throw new Error("Not found: " + path + " when executing " + "file" + " in " + this);
					return methods.old.file.call(target,adaptResource(resource),context);
				};
			}

			/**
			 *
			 * @param { string } path
			 * @returns { { prefix: string, main: string } }
			 */
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

			var getModuleScope = function($context,locations) {
				/** @type { slime.old.loader.Scope } */
				var inner = createScriptScope($context);
				inner.$loader = Child(locations.prefix);
				return inner;
			}

			if (p.get) {
				/** @type { slime.old.Loader["module"] } */
				this.module = function(path,$context,target) {
					var locations = getModuleLocations(path);
					var inner = getModuleScope($context,locations);
					var script = this.get(locations.main);
					//	TODO	generalize error handling strategy; add to file, run, value
					if (!script) throw new Error("Module not found at " + locations.main);
					methods.run.call(target,adaptResource(script),inner);
					return inner.$exports;
				};
			}

			var inModule = (
				/**
					* @this { slime.old.Loader }
					* @param { string } path
					* @param { any } $context
					* @param { any } target
					* @returns
					*/
				function(path,$context,target) {
					var locations = getModuleLocations(path);
					var inner = getModuleScope($context,locations);
					return this.thread.get(locations.main).then(function(script) {
						methods.run.call(target,adaptResource(script),inner);
						return inner.$exports;
					});
				}
			).bind(this);

			if (p.thread) {
				this.thread.module = inModule;
			}

			if (p.get) {
				/** @type { slime.old.Loader["script"] } */
				this.script = function(path) {
					var $loader = this;
					var sync = function(c) {
						return $loader.module(path, c);
					}
					var async = function(c) {
						if (p.thread) {
							return inModule(path, c, void(0));
						} else {
							return {
								then: function(f) {
									return f($loader.module(path, c));
								}
							}
						}
					}
					return Object.assign(
						sync,
						{
							thread: async
						}
					)
				};

				this.factory = $api.deprecate(this.script);
			}

			var Child = (function(parent,source) {
				/**
					*
					* @param { string } prefix
					* @returns
					*/
				function rv(prefix) {
					//	TODO	should we short-circuit if prefix is empty string?
					if (prefix && prefix.substring(prefix.length-1) != "/") throw new Error("Prefix not ending with /");
					var parameter = (source.child) ? source.child(prefix) : {
						toString: function() {
							return "Child [" + prefix + "] of " + source.toString();
						},
						get: (source.get) ? function(path) {
							return source.get(prefix + path);
						} : void(0),
						thread: (source.thread) ? {
							get: function(path) {
								return source.thread.get(prefix + path);
							}
						} : void(0),
						list: (source.list) ? function(given) {
							if (given) {
								var slash = given.substring(given.length-1);
								if (slash != "/") {
									throw new Error("Given list path not ending with /: " + given)
								}
							}
							var nowprefix = (given) ? prefix + given : prefix;
							return source.list(nowprefix);
						} : void(0)
					};

					/**
						* @returns { new (p: any) => slime.old.Loader }
						*/
					var castToConstructor = function(v) {
						return v;
					}
					var ParentConstructor = castToConstructor(parent.constructor);
					return new ParentConstructor(parameter);
				}
				return rv;
			})(this,p);

			/** @type { slime.old.Loader["Child"] } */
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

				/** @type { slime.old.Loader["list"] } */
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
								var item = {
									path: entry.path
								};
								Object.defineProperty(item, "resource", {
									enumerable: true,
									get: function() {
										return new p.Resource(p.get(entry.path));
									}
								});
								rv.push(item);
							}
						}
					);
					return rv;
				}
			}

			this.toSynchronous = function() {
				var loader = this;
				return {
					get: function(path) {
						var r = loader.get(path.join("/"));
						if (r == null) return $api.fp.Maybe.from.nothing();
						return $api.fp.Maybe.from.some(r);
					},
					list: (loader.list) ? function(path) {
						var child = loader.Child(path.join("/") + "/");
						var listing = child.list();
						if (!listing) return $api.fp.Maybe.from.nothing();
						return $api.fp.Maybe.from.some(listing.map(function(entry) {
							if (isResourceEntry(entry)) return {
								name: entry.path,
								resource: true,
								parent: false
							};
							return {
								name: entry.path,
								resource: false,
								parent: true
							};
						}));
					} : void(0),
					code: function(t) {
						return {
							name: t.name,
							type: function() { return t.type; },
							read: function() {
								return t.read.string();
							}
						}
					}
				}
			};
		}

		$export({
			api: {
				/** @type { slime.runtime.Exports["old"]["loader"]["source"] } */
				source: {
					/** @type { slime.runtime.Exports["old"]["loader"]["source"]["object"] } */
					object: function(o) {
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

						return {
							get: function(path) {
								//	TODO	should not return directories
								var location = getLocation(path);
								return (location) ? location.loader[location.path].resource : null;
							},
							list: function(path) {
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
						}
					}
				},
				series: function(list) {
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
					return new old(source);
				},
				tools: {
					toExportScope: toExportScope
				},
				from: {
					synchronous: function(synchronous) {
						/** @type { slime.old.loader.Source } */
						var source = {
							get: function(path) {
								var delegate = synchronous.get(path.split("/"));
								if (delegate.present) {
									var code = synchronous.code(delegate.value);
									return {
										name: code.name,
										type: code.type(),
										read: {
											string: code.read
										}
									};
								} else {
									return null;
								}
							},
							list: function(path) {
								var parsed = function(path) {
									if (path.length == 0) return [];
									if (!/\/$/.test(path)) throw new Error("Path must end in /");
									return path.substring(0,path.length-1).split("/");
								}
								var delegate = synchronous.list(parsed(path));
								if (delegate.present) {
									var value = delegate.value;
									return value.map(
										/* @returns { slime.old.loader.source.Entry } */
										function(node) {
											return {
												path: node.name,
												loader: node.parent,
												resource: node.resource
											}
										}
									);
								} else {
									//	TODO	is this right?
									return null;
								}
							}
						};
						return new old(source);
					}
				}
			},
			Code: {
				from: {
					Resource: adaptResource
				}
			},
			constructor: old
		});
	}
//@ts-ignore
)($api,toExportScope,Resource,createScriptScope,methods,$export);
