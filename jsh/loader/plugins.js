//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.loader.Export<slime.jsh.loader.internal.plugins.Export> } $export
	 */
	function(Packages,$slime,jsh,$export) {
		//	Bootstrap some Java logging; we end up loading a plugin that does more of this in the standard jsh implementation but
		//	it is obviously not available here, so we use this API within this file
		var log = function(_level,message) {
			//	TODO	improve with parameters, but then would need to create Java arrays and so forth
			Packages.java.util.logging.Logger.getLogger("inonit.script.jsh.Shell").log(
				_level,
				message
			);
		};
		log.Level = Packages.java.util.logging.Level;

		/**
		 * Executes the plugin code from a specific plugin.jsh.js at the top level of a loader and returns a list of
		 * implementations with 'declaration' properties representing the objects provided by the implementor and 'toString'
		 * methods supplied by the caller of this function.
		 *
		 * @type { slime.jsh.loader.internal.plugins.register }
		 */
		var register = function register(p) {
			/** @type { slime.jsh.plugin.Scope } */
			var scope = {};
			//	TODO	$host is currently *automatically* in scope for these plugins, but that is probably not as it should be; see
			//			issue 32. $host *should* be in scope, though; we should just have to put it there manually.
			scope.plugins = p.plugins;
			var rv = [];
			scope.plugin = function(declaration) {
				if (typeof(declaration.isReady) == "undefined") {
					declaration.isReady = function() {
						return true;
					};
				}
				if (typeof(declaration.disabled) == "undefined") {
					declaration.disabled = function() {
						return "never returned true from isReady(): " + declaration.isReady;
					}
				}
				rv.push({
					toString: p.toString,
					declaration: declaration
				});
			}

			scope.$slime = (p.mock && p.mock.$slime) ? p.mock.$slime : $slime;

			(function setDeprecatedProperty(object,property,value) {
				object[property] = value;
				//	TODO	deprecating $jsh property breaks Nashorn somehow, apparently by making the global $jsh the one seen
				if (typeof(Packages.org.mozilla.javascript.Context.getCurrentContext) == "function" && Packages.org.mozilla.javascript.Context.getCurrentContext() != null) {
					$slime.$api.deprecate(object,property);
				}
			})(scope,"$jsh",$slime);

			scope.global = (p.mock && p.mock.global) ? p.mock.global : (function() { return this; })();
			scope.jsh = (function() {
				if (p.mock && p.mock.jsh) return p.mock.jsh;
				if (p.mock && p.mock.global && p.mock.global.jsh) return p.mock.global.jsh;
				return jsh;
			})();
			if (typeof(scope.jsh) == "undefined") throw new Error("jsh undefined");
			scope.$loader = Object.assign(p.$loader, { classpath: void(0) });
			scope.$loader.classpath = new function() {
				this.add = function(pathname) {
					$slime.classpath.add({ _file: pathname.java.adapt() });
				}
			};
			scope.$loader.run("plugin.jsh.js", scope);
			return rv;
		};

		//	Given an array of plugin objects returned by load(), run all of those that are ready until all have been run or are not
		//	ready
		var run = function(plugins) {
			var stop = false;
			while(plugins.length > 0 && !stop) {
				var ranSomething = false;
				var i = 0;
				while(i < plugins.length) {
					if (plugins[i].declaration.isReady()) {
						plugins[i].declaration.load();
						plugins.splice(i,1);
						ranSomething = true;
					} else {
						i++;
					}
				}
				if (plugins.length > 0 && !ranSomething) {
					//	Some plugin was never ready
					stop = true;
					//	TODO	think harder about what to do
					plugins.forEach(function(item) {
						try {
							log(log.Level.WARNING, "Plugin from " + item + " is disabled: " + item.declaration.disabled());
						} catch (e) {
							//	TODO	default value for object?!?
							log(log.Level.WARNING, "Plugin is disabled: " + item.declaration.disabled());
						}
					});
				}
			}
		};

		/** @type { slime.jsh.loader.internal.plugins.Export["mock"] } */
		var mock = function(p) {
			if (!p.global && p.jsh) p.global = { jsh: p.jsh }
			if (!p.plugins) p.plugins = {};
			var list = register({
				plugins: (p.plugins) ? p.plugins : {},
				toString: (p.toString) ? p.toString : function() { return "mock"; },
				$loader: p.$loader,
				mock: {
					global: p.global,
					$slime: p.$slime
				}
			});
			run(list);
			return {
				global: p.global,
				jsh: p.global.jsh,
				plugins: p.plugins
			}
		};

		/** @type { (entry: slime.old.loader.Entry) => entry is slime.old.loader.ResourceEntry } */
		var isResourceEntry = function(entry) { return Boolean(entry["resource"]); };
		/** @type { (entry: slime.old.loader.Entry) => entry is slime.old.loader.LoaderEntry } */
		var isLoaderEntry = function(entry) { return Boolean(entry["loader"]); };

		/**
		 *
		 * @param { slime.old.Loader } loader
		 * @param { slime.jsh.loader.internal.plugins.Source[] } [list]
		 */
		var scan = function(loader,list) {
			if (!list) list = [];
			if (loader.get("plugin.jsh.js")) {
				list.push({
					loader: loader
				});
			} else {
				if (loader.list) {
					var listed = loader.list();
					for (var i=0; i<listed.length; i++) {
						var entry = listed[i];
						if (isLoaderEntry(entry)) {
							scan(entry.loader,list);
						} else if (/\.slime$/.test(entry.path)) {
							list.push({ slime: entry.resource });
						} else if (/\.jar$/.test(entry.path)) {
							list.push({ jar: entry.resource });
						} else {
							//	ignore other kinds of files, presumably
						}
					}
				}
			}
			return list;
		}

		/** @type { (plugins: slime.jsh.loader.internal.plugins.Plugins) => plugins is slime.jsh.loader.internal.plugins.ZipFilePlugins } */
		var isZipFilePlugins = function(plugins) {
			return Boolean(plugins["zip"])
		};

		/** @type { (plugins: slime.jsh.loader.internal.plugins.Plugins) => plugins is slime.jsh.loader.internal.plugins.JavaFilePlugins } */
		var isJavaFilePlugins = function(plugins) {
			return Boolean(plugins["_file"]);
		};

		/** @type { (plugins: slime.jsh.loader.internal.plugins.Plugins) => plugins is slime.jsh.loader.internal.plugins.LoaderPlugins } */
		var isLoaderPlugins = function(plugins) {
			return Boolean(plugins["loader"]);
		};

		/** @type { (source: slime.jsh.loader.internal.plugins.Source) => source is slime.jsh.loader.internal.plugins.LoaderSource } */
		var isLoaderSource = function(source) {
			return Boolean(source["loader"]);
		}

		/** @type { (source: slime.jsh.loader.internal.plugins.Source) => source is slime.jsh.loader.internal.plugins.SlimeSource } */
		var isSlimeSource = function(source) {
			return Boolean(source["slime"]);
		}

		/** @type { (source: slime.jsh.loader.internal.plugins.Source) => source is slime.jsh.loader.internal.plugins.JarSource } */
		var isJarSource = function(source) {
			return Boolean(source["jar"]);
		}

		/** @type { slime.jsh.loader.internal.plugins.Export["load"] } */
		var load = function(p) {
			var loader = (function(p) {
				//	TODO	we really assume the file is a directory here, I think, and used to explicitly check for that. Perhaps
				//			we should allow a file; we allegedly allow .slime plugins to be built; it seems here we are saying they
				//			can't be loaded, though.
				if (isJavaFilePlugins(p)) return new $slime.Loader({ _file: p._file });
				if (isLoaderPlugins(p)) return p.loader;
			})(p);
			var list = [];
			var plugins = {};
			if (loader) {
				var sources = scan(loader);
				sources.sort(function(a,b) {
					var precedence = function(item) {
						return 0;
					}

					return precedence(b) - precedence(a);
				});
				//	TODO	should this share with jsh loader?
				//	Use while loop because loop can add to the list; not sure how .forEach() works in that instance
				//	TODO	check the above
				var index = 0;
				while(index < sources.length) {
					var item = sources[index];
					if (isLoaderSource(item)) {
						$slime.classpath.add({ src: { loader: item.loader }});
						var array = register({
							plugins: plugins,
							toString: (function(item) {
								return function() {
									return item.loader.toString();
								};
							})(item),
							$loader: item.loader
						});
						list.push.apply(list,array);
					} else if (isSlimeSource(item)) {
						var subloader = new $slime.Loader({ zip: { resource: item.slime } });
						$slime.classpath.add({ slime: { loader: subloader } });
						//	TODO	.slime files cannot contain multiple plugin folders; we only look at the top level. Is this a good
						//			decision?
						if (subloader.get("plugin.jsh.js")) {
							sources.push({
								loader: subloader
							});
						}
					} else if (isJarSource(item)) {
						$slime.classpath.add({ jar: { resource: item.jar }});
					} else {
						//	TODO	some kind of error condition, maybe throw TypeError
					}
					index++;
				}
			} else if (isZipFilePlugins(p)) {
				var name = String(p.zip._file.getName());
				if (/\.jar$/.test(name)) {
					$slime.classpath.add({ jar: { _file: p.zip._file }});
				} else if (/\.slime$/.test(name)) {
					throw new Error("Deal with .slime");
				} else {
					throw new Error("Deal with " + name);
				}
			} else {
				//	TODO	this is some kind of error condition; probably should throw TypeError
			}
			run(list);
		};

		$export({
			load: load,
			mock: mock
		});
	}
//@ts-ignore
)(Packages,$slime,jsh,$export)
