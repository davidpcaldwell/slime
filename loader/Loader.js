//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.internal.loader.Scope["Resource"] } Resource
	 * @param { slime.runtime.internal.loader.Scope["methods"] } methods
	 * @param { slime.runtime.internal.loader.Scope["createScriptScope"] } createScriptScope
	 * @param { slime.runtime.internal.loader.Scope["$api"] } $api
	 * @param { slime.old.loader.Export<slime.runtime.internal.loader.Exports> } $export
	 */
	function(Resource,methods,createScriptScope,$api,$export) {
		/**
		 * @type { slime.runtime.loader.Exports }
		 */
		var api = {
			synchronous: {
				script: function(loader, path) {
					var resource = loader.get(path);

					/** @type { (p: slime.runtime.loader.Code) => slime.Resource } */
					var adapt = function(code) {
						var string = code.read();
						return {
							name: path,
							type: void(0),
							read: Object.assign(
								function(p) {
									if (p === String) return string;
									throw new TypeError("Adapter unimplemented for " + p);
								},
								{
									string: function() {
										throw new TypeError("Adapter .string() unimplemented.");
									}
								}
							)
						}
					};

					if (resource.present) {
						var code = loader.code(resource.value);
						var oldResource = adapt(code);

						return function(context) {
							var rv;

							methods.old.run(
								oldResource,
								{
									$context: context,
									$loader: void(0),
									$export: function(v) {
										rv = v;
									}
								}
							);

							return rv;
						}
					} else {
						return null;
					}
				}
			},
			object: {
				Synchronous: function(loader) {
					return {
						script: function(path) {
							return api.synchronous.script(loader, path);
						}
					}
				}
			}
		};

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
				return p.thread.get(path).then(get);
			}

			/**
				* @this { slime.old.Loader }
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
						return methods.old[name].call(target,resource,context);
					}
				);
			};

			if (p.get) {
				/** @type { slime.old.Loader["run"] } */
				this.run = void(0);
				/** @type { slime.old.Loader["value"] } */
				this.value = void(0);
				/** @type { slime.old.Loader["file"] } */
				this.file = void(0);
				declare.call(this,"run");
				declare.call(this,"value");
				declare.call(this,"file");
			}

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
					methods.old.run.call(target,script,inner);
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
						methods.old.run.call(target,script,inner);
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
		}

		$export({
			old: old,
			api: api
		});
	}
//@ts-ignore
)(Resource,methods,createScriptScope,$api,$export);
