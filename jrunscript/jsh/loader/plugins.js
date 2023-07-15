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

			//	TODO	this rigamarole exists to support the deprecated $jsapi.loader.plugin.mock API. This is the wrong place to
			//			put it but the simplest change to make to get it working in this refactored structure.
			var $jsapi_loader_plugin_mock = (p.$loader["plugin"] && p.$loader["plugin"].mock) ? p.$loader["plugin"].mock : void(0);

			scope.$loader = Object.assign(
				p.$loader,
				{
					classpath: {
						add: function(pathname) {
							scope.$slime.classpath.add({ _file: pathname.java.adapt() });
						}
					},
					plugin: function(path) {
						var sub = register({
							scope: scope,
							$loader: p.$loader.Child(path),
							source: function() {
								return p.source() + " subpath=" + path;
							}
						});
						rv = rv.concat(sub);
					}
				}
			);

			if ($jsapi_loader_plugin_mock) scope.$loader.plugin["mock"] = $jsapi_loader_plugin_mock;

			//	TODO	this rigamarole exists to support the deprecated $jsapi.loader.plugin.mock API. This is the wrong place to
			//			put it but the simplest change to make.
			if (p.$loader["plugin"] && p.$loader["plugin"].mock) scope.$loader.plugin["mock"] = p.$loader["plugin"].mock;

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

		/** @type { slime.$api.fp.Mapping<slime.jsh.loader.internal.plugins.Source,slime.jsh.loader.internal.plugins.SourceContent> } */
		var getContent = function(item) {
			if (isLoaderSource(item)) {
				return {
					source: {
						loader: item.loader,
						from: function() {
							return item.loader.toString();
						}
					},
					classes: {
						src: {
							loader: item.loader
						}
					}
				}
			} else if (isSlimeSource(item)) {
				var subloader = new $slime.Loader({ zip: { resource: item.slime } });
				if (subloader.get("plugin.jsh.js")) {
					return {
						source: {
							loader: subloader,
							from: function() {
								return subloader.toString();
							}
						},
						classes: {
							slime: {
								loader: subloader
							}
						}
					}
				}
			} else if (isJarSource(item)) {
				return {
					classes: {
						jar: {
							resource: item.jar
						}
					}
				}
			}
		}

		/**
		 * @param { Parameters<register>[0]["scope"] } scope
		 * @param { slime.old.Loader } loader
		 * @returns { slime.jsh.loader.internal.plugins.PluginsContent }
		 */
		var getPluginsContent = function(scope,loader) {
			/** @type { slime.jsh.loader.internal.plugins.PluginsContent } */
			var rv = {
				plugins: [],
				classpath: []
			};
			var sources = scan(loader);

			//	TODO	should this share with jsh loader?
			sources.forEach(function(item) {
				var content = getContent(item);
				if (content.source) {
					var array = register({
						scope: scope,
						$loader: content.source.loader,
						source: content.source.from
					});
					rv.plugins.push.apply(rv.plugins,array);
				}
				if (content.classes) {
					rv.classpath.push(content.classes);
				}
			});

			return rv;
		}

		/**
		 * Updates the current environment with the provided content. Note that in the current somewhat-imperfect design, the
		 * "destination" for plugins is baked in at the time we load the plugin code, using the scope that is provided at that time.
		 * In contrast, we can in theory apply classpath changes at the end, but in practice, we do not have a reasonable mock
		 * classpath implementation.
		 *
		 * So for realistic purposes, this method affects the real shell's classpath, and affects whatever mocks might have been
		 * given at load time in terms of the plugins loaded.
		 *
		 * @param { slime.jsh.loader.internal.plugins.PluginsContent } content
		 */
		var update = function(content) {
			content.classpath.forEach(function(entry) {
				$slime.classpath.add(entry);
			});
			run(content.plugins);
		}

		/** @type { slime.jsh.loader.internal.plugins.Export["load"] } */
		var load = function(p) {
			/** @type { slime.jsh.loader.internal.plugins.PluginsContent } */
			var content;

			/** @type { Parameters<register>[0]["scope"] } */
			var scope = {
				$slime: $slime,
				plugins: {},
				global: (function() { return this; })(),
				jsh: jsh
			}

			if (isJavaFilePlugins(p)) {
				content = getPluginsContent(
					scope,
					new $slime.Loader({ _file: p._file })
				);
			} else if (isLoaderPlugins(p)) {
				content = getPluginsContent(
					scope,
					p.loader
				);
			} else if (isZipFilePlugins(p)) {
				var name = String(p.zip._file.getName());
				if (/\.jar$/.test(name)) {
					content = {
						plugins: [],
						classpath: [
							{ jar: { _file: p.zip._file }}
						]
					};
				} else if (/\.slime$/.test(name)) {
					throw new Error("Deal with .slime");
				} else {
					throw new Error("Deal with " + name);
				}
			} else {
				//	TODO	this is some kind of error condition; probably should throw TypeError
			}
			update(content);
		};

		/** @type { slime.jsh.plugin.$slime["plugins"]["mock"] } */
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
			/** @type { Parameters<register>[0]["scope"] } */
			var scope = {
				plugins: p.plugins || {},
				$slime: p.$slime || $slime,
				global: globals.global,
				jsh: globals.jsh
			};
			var content = getPluginsContent(scope, p.$loader);
			update(content);
			return {
				global: scope.global,
				jsh: scope.jsh,
				plugins: scope.plugins
			};
		};

		$export({
			load: load,
			mock: mock
		});
	}
//@ts-ignore
)(Packages,$slime,jsh,$export)
