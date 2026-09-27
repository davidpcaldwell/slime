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
	 * @param { slime.loader.Export<slime.jsh.internal.loader.plugins.Export> } $export
	 * @param { { enabled: boolean, checkpoint: (phase: string, fields?: { [name: string]: any }) => void } } profile
	 */
	function(Packages,$slime,jsh,$export,profile) {
		var checkpoint = function(phase, fields) {
			if (!profile || !profile.enabled) return;
			profile.checkpoint(phase, fields);
		};

		var sourceFields = function(source) {
			if (!profile || !profile.enabled) return {};
			return { source: source() };
		};

		var sourceType = function(item) {
			if (isLoaderSource(item)) return "loader";
			if (isSlimeSource(item)) return "slime";
			if (isJarSource(item)) return "jar";
			return "unknown";
		};

		var pluginsType = function(p) {
			if (isJavaFilePlugins(p)) return "file";
			if (isSynchronousLoaderPlugins(p)) return "synchronous";
			if (isOldLoaderPlugins(p)) return "loader";
			if (isZipFilePlugins(p)) return "zip";
			return "unknown";
		};

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
		 * @type { slime.jsh.internal.loader.plugins.register }
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

			checkpoint("jsh.plugins.register.start", sourceFields(p.source));
			scope.$loader.run("plugin.jsh.js", scope);
			checkpoint("jsh.plugins.register.end", Object.assign(sourceFields(p.source), { count: rv.length }));

			return rv;
		};

		/**
		 * Given an array of plugin objects returned by load(), run all of those that are ready until all have been run or are not
		 * ready.
		 *
		 * @param { slime.jsh.internal.loader.plugins.Plugin[] } plugins
		 */
		var run = function(plugins) {
			var stop = false;
			while(plugins.length > 0 && !stop) {
				var ranSomething = false;
				var i = 0;
				while(i < plugins.length) {
					checkpoint("jsh.plugins.ready.start", sourceFields(plugins[i].source));
					if (plugins[i].implementation.isReady()) {
						checkpoint("jsh.plugins.ready.end", Object.assign(sourceFields(plugins[i].source), { ready: true }));
						checkpoint("jsh.plugins.load.start", sourceFields(plugins[i].source));
						plugins[i].implementation.load();
						checkpoint("jsh.plugins.load.end", sourceFields(plugins[i].source));
						plugins.splice(i,1);
						ranSomething = true;
					} else {
						checkpoint("jsh.plugins.ready.end", Object.assign(sourceFields(plugins[i].source), { ready: false }));
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

		/** @type { (entry: slime.loader.old.loader.Entry) => entry is slime.loader.old.loader.ResourceEntry } */
		var isResourceEntry = function(entry) { return Boolean(entry["resource"]); };
		/** @type { (entry: slime.loader.old.loader.Entry) => entry is slime.loader.old.loader.LoaderEntry } */
		var isLoaderEntry = function(entry) { return Boolean(entry["loader"]); };

		/**
		 *
		 * @param { slime.loader.old.Loader } loader
		 * @returns { slime.jsh.internal.loader.plugins.Source[] }
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

		/** @type { (plugins: slime.jsh.internal.loader.plugins.Plugins) => plugins is slime.jsh.internal.loader.plugins.ZipFilePlugins } */
		var isZipFilePlugins = function(plugins) {
			return Boolean(plugins["zip"])
		};

		/** @type { (plugins: slime.jsh.internal.loader.plugins.Plugins) => plugins is slime.jsh.internal.loader.plugins.JavaFilePlugins } */
		var isJavaFilePlugins = function(plugins) {
			return Boolean(plugins["_file"]);
		};

		/** @type { (plugins: slime.jsh.internal.loader.plugins.Plugins) => plugins is slime.jsh.internal.loader.plugins.SynchronousLoaderPlugins } */
		var isSynchronousLoaderPlugins = function(plugins) {
			return Boolean(plugins["synchronous"]);
		};

		/** @type { (plugins: slime.jsh.internal.loader.plugins.Plugins) => plugins is slime.jsh.internal.loader.plugins.OldLoaderPlugins } */
		var isOldLoaderPlugins = function(plugins) {
			return Boolean(plugins["loader"]);
		};

		/** @type { (source: slime.jsh.internal.loader.plugins.Source) => source is slime.jsh.internal.loader.plugins.LoaderSource } */
		var isLoaderSource = function(source) {
			return Boolean(source["loader"]);
		}

		/** @type { (source: slime.jsh.internal.loader.plugins.Source) => source is slime.jsh.internal.loader.plugins.SlimeSource } */
		var isSlimeSource = function(source) {
			return Boolean(source["slime"]);
		}

		/** @type { (source: slime.jsh.internal.loader.plugins.Source) => source is slime.jsh.internal.loader.plugins.JarSource } */
		var isJarSource = function(source) {
			return Boolean(source["jar"]);
		}

		/** @type { slime.$api.fp.Mapping<slime.jsh.internal.loader.plugins.Source,slime.jsh.internal.loader.plugins.SourceContent> } */
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
		 * @param { slime.loader.old.Loader } loader
		 * @returns { slime.jsh.internal.loader.plugins.PluginsContent }
		 */
		var getPluginsContent = function getPluginsContent(scope,loader) {
			/** @type { slime.jsh.internal.loader.plugins.PluginsContent } */
			var rv = {
				plugins: [],
				classpath: []
			};
			checkpoint("jsh.plugins.scan.start", { loader: loader.toString() });
			var sources = scan(loader);
			checkpoint("jsh.plugins.scan.end", { loader: loader.toString(), count: sources.length });

			//	TODO	should this share with jsh loader?
			sources.forEach(function(item) {
				checkpoint("jsh.plugins.content.source.start", { type: sourceType(item) });
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
				checkpoint("jsh.plugins.content.source.end", { type: sourceType(item), plugins: rv.plugins.length, classpath: rv.classpath.length });
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
		 * @param { slime.jsh.internal.loader.plugins.PluginsContent } content
		 */
		var update = function(content) {
			checkpoint("jsh.plugins.update.start", { plugins: content.plugins.length, classpath: content.classpath.length });
			content.classpath.forEach(function(entry) {
				checkpoint("jsh.plugins.classpath.add.start");
				$slime.classpath.add(entry);
				checkpoint("jsh.plugins.classpath.add.end");
			});
			run(content.plugins);
			checkpoint("jsh.plugins.update.end", { plugins: content.plugins.length, classpath: content.classpath.length });
		}

		/** @type { slime.jsh.internal.loader.plugins.Export["load"] } */
		var load = function(p) {
			checkpoint("jsh.plugins.loadSource.start", { type: pluginsType(p) });
			/** @type { slime.jsh.internal.loader.plugins.PluginsContent } */
			var content;

			/** @type { Parameters<register>[0]["scope"] } */
			var scope = {
				$slime: $slime,
				plugins: {},
				global: (function() { return this; })(),
				jsh: jsh
			};

			if (isJavaFilePlugins(p)) {
				content = getPluginsContent(
					scope,
					new $slime.Loader({ _file: p._file })
				);
			} else if (isSynchronousLoaderPlugins(p)) {
				//	Copilot suggested removing next line as a no-op, which seems right, but what was it for?
				//$slime.$api.loader.old.old.loader.source.object
				content = getPluginsContent(
					scope,
					$slime.$api.loader.old.old.loader.from.synchronous(p.synchronous)
				);
			} else if (isOldLoaderPlugins(p)) {
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
			checkpoint("jsh.plugins.loadSource.end", { type: pluginsType(p) });
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
)(Packages,$slime,jsh,$export,profile)
