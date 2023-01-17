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
		/**
		 *
		 * @param { slime.jrunscript.native.java.util.logging.Level } _level
		 * @param { string } message
		 */
		var log = Object.assign(
			function(_level,message) {
				//	TODO	improve with parameters, but then would need to create Java arrays and so forth
				Packages.java.util.logging.Logger.getLogger("inonit.script.jsh.Shell").log(
					_level,
					message
				);
			},
			{
				Level: Packages.java.util.logging.Level
			}
		);

		/**
		 * Executes the plugin code from a specific plugin.jsh.js at the top level of a loader and returns a list of
		 * implementations with 'declaration' properties representing the objects provided by the implementor and 'toString'
		 * methods supplied by the caller of this function.
		 *
		 * @type { slime.jsh.loader.internal.plugins.register }
		 */
		var register = function register(p) {
			if (typeof(p.scope.jsh) == "undefined") throw new Error("jsh undefined");

			/** @type { ReturnType<register> } */
			var rv = [];

			/** @type { slime.jsh.plugin.Scope } */
			var scope = {};

			scope.plugins = p.scope.plugins;

			scope.plugin = function(declaration) {
				rv.push({
					source: p.source,
					implementation: {
						load: declaration.load,
						isReady: declaration.isReady || function() {
							return true;
						},
						disabled: declaration.disabled || function() {
							return "never returned true from isReady(): " + declaration.isReady;
						}
					}
				});
			}

			scope.$slime = p.scope.$slime;
			Object.defineProperty(scope, "$jsh", {
				get: function() {
					throw new TypeError("The $jsh scope property in jsh plugins has been removed; use $slime instead.")
				}
			});

			scope.global = p.scope.global;

			scope.jsh = p.scope.jsh;

			scope.$loader = Object.assign(
				p.$loader,
				{
					classpath: {
						add: function(pathname) {
							scope.$slime.classpath.add({ _file: pathname.java.adapt() });
						}
					}
				}
			);

			scope.$loader.run("plugin.jsh.js", scope);

			return rv;
		};

		/**
		 * Given an array of plugin objects returned by load(), run all of those that are ready until all have been run or are not
		 * ready.
		 *
		 * @param { slime.jsh.loader.internal.plugins.Plugin[] } plugins
		 */
		var run = function(plugins) {
			var stop = false;
			while(plugins.length > 0 && !stop) {
				var ranSomething = false;
				var i = 0;
				while(i < plugins.length) {
					if (plugins[i].implementation.isReady()) {
						plugins[i].implementation.load();
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
						log(log.Level.WARNING, "Plugin from " + item.source() + " is disabled: " + item.implementation.disabled());
					});
				}
			}
		};

		/** @type { slime.jsh.loader.internal.plugins.Export["mock"] } */
		var mock = function(p) {
			var globals = (
				/**
				 * @param { Parameters<mock>[0] } p
				 * @returns { Pick<Parameters<mock>[0],"global"|"jsh"> }
				 */
				function(p) {
					if (p.global && p.jsh) return p;
					if (p.global && !p.jsh) return { global: p.global, jsh: p.global.jsh };
					if (!p.global && p.jsh) return { global: { jsh: p.jsh }, jsh: p.jsh };
					if (!p.global && !p.jsh) return { global: (function() { return this; })(), jsh: jsh };
				}
			)(p);
			var plugins = p.plugins || {};
			var list = register({
				scope: {
					plugins: plugins,
					$slime: p.$slime || $slime,
					global: globals.global,
					jsh: globals.jsh
				},
				$loader: p.$loader,
				source: (p.source) || function() { return "mock"; }
			});
			run(list);
			return {
				global: globals.global,
				jsh: globals.jsh,
				plugins: plugins
			};
		};

		/** @type { (entry: slime.old.loader.Entry) => entry is slime.old.loader.ResourceEntry } */
		var isResourceEntry = function(entry) { return Boolean(entry["resource"]); };
		/** @type { (entry: slime.old.loader.Entry) => entry is slime.old.loader.LoaderEntry } */
		var isLoaderEntry = function(entry) { return Boolean(entry["loader"]); };

		/**
		 *
		 * @param { slime.old.Loader } loader
		 * @returns { slime.jsh.loader.internal.plugins.Source[] }
		 */
		var scan = function(loader) {
			/** @type { ReturnType<scan> } */
			var rv = [];
			if (loader.get("plugin.jsh.js")) {
				rv.push({
					loader: loader
				});
			} else {
				if (loader.list) {
					var listed = loader.list();
					for (var i=0; i<listed.length; i++) {
						var entry = listed[i];
						if (isLoaderEntry(entry)) {
							rv = rv.concat(scan(entry.loader));
						} else if (/\.slime$/.test(entry.path)) {
							rv.push({ slime: entry.resource });
						} else if (/\.jar$/.test(entry.path)) {
							rv.push({ jar: entry.resource });
						} else {
							//	ignore other kinds of files, presumably
						}
					}
				}
			}
			return rv;
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

				/**
				 *
				 * @param { slime.jsh.loader.internal.plugins.LoaderSource } item
				 * @param { (item: slime.jsh.loader.internal.plugins.LoaderSource ) => void } addToClasspath
				 */
				var registerLoaderSource = function(item, addToClasspath) {
					addToClasspath(item);
					var array = register({
						scope: {
							$slime: $slime,
							plugins: plugins,
							global: (function() { return this; })(),
							jsh: jsh
						},
						$loader: item.loader,
						source: (function(item) {
							return function() {
								return item.loader.toString();
							};
						})(item),
					});
					list.push.apply(list,array);
				}

				//	TODO	should this share with jsh loader?
				sources.forEach(function(item) {
					if (isLoaderSource(item)) {
						registerLoaderSource(
							item,
							function(item) {
								$slime.classpath.add({ src: { loader: item.loader }});
							}
						);
					} else if (isSlimeSource(item)) {
						var subloader = new $slime.Loader({ zip: { resource: item.slime } });
						//	TODO	.slime files cannot contain multiple plugin folders; we only look at the top level. Is this a good
						//			decision?
						if (subloader.get("plugin.jsh.js")) {
							registerLoaderSource(
								{
									loader: subloader
								},
								function(item) {
									$slime.classpath.add({ slime: { loader: item.loader } });
								}
							);
						}
					} else if (isJarSource(item)) {
						$slime.classpath.add({ jar: { resource: item.jar }});
					} else {
						//	TODO	some kind of error condition, maybe throw TypeError
					}
				});
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
