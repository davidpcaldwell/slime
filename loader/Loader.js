//@ts-check
(
	/**
	 *
	 * @param { any } Resource
	 * @param { any } methods
	 * @param { any } createFileScope
	 * @param { slime.$api.Global } $api
	 * @param { any } $export
	 */
	function(Resource,methods,createFileScope,$api,$export) {
		$export(
			/**
			 * @constructor
			 * @param { ConstructorParameters<slime.runtime.Exports["Loader"]>[0] } p
			 */
			function(p) {
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

					/** @type { slime.loader.Scope } */
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
					/**
					 *
					 * @param { string } prefix
					 * @returns
					 */
					function rv(prefix) {
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
					return rv;
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
			}
		)
	}
//@ts-ignore
)(Resource,methods,createFileScope,$api,$export);
