//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.java.tools.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.java.tools.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		/**
		 *
		 * @returns { { command: (args: string[]) => number } }
		 */
		function getJavaCompiler() {
			if (Packages.javax.tools.ToolProvider.getSystemJavaCompiler()) {
				return new function() {
					this.command = function javac(args) {
						return Packages.javax.tools.ToolProvider.getSystemJavaCompiler().run(
							null, null, null,
							$context.library.java.Array.create({
								type: Packages.java.lang.String,
								array: args.map(function(s) { return new Packages.java.lang.String(s); })
							})
						)
					}
				};
			} else {
				var toolpath = $context.library.file.Searchpath([ $context.library.shell.java.home.getRelativePath("bin") ]);
				if (toolpath.getCommand("javac")) {
					return new function() {
						this.command = function(args) {
							return $context.library.shell.run({
								command: toolpath.getCommand("javac"),
								arguments: args,
								evaluate: function(result) {
									return result.status;
								}
							});
						}
					}
				}
			}
		}

		var javac = $api.fp.impure.Input.memoized(function() {
			var javac = getJavaCompiler();

			if (!javac) return function(){}();
			/** @type { slime.jrunscript.java.tools.Exports["javac"] } */
			var rv = function(p) {
				/** @type { string[] } */
				var args = [];
				//	TODO	add documentation and test
				if (p.debug === true) {
					args.push("-g");
				}
				//	TODO	accept destination that is directory object, not just Pathname
				if (p.destination) {
					//	TODO	figure out what to do with recursive
					p.destination.createDirectory({
						ifExists: function(dir) {
							return false;
						},
						recursive: false
					});
					args.push("-d", p.destination.toString());
				}
				if (p.classpath && p.classpath.pathnames.length) {
					args.push("-classpath", p.classpath.toString());
				}
				if (p.sourcepath && p.sourcepath.pathnames.length) {
					args.push("-sourcepath", p.sourcepath.toString());
				}
				if (p.source) {
					args.push("-source", p.source);
				}
				if (p.target) {
					args.push("-target", p.target);
				}
				if (p.arguments) {
					args = args.concat(p.arguments.map(function(file) {
						return file.toString();
					}));
				}
				var status = javac.command(args);
				var evaluate = (p.evaluate) ? p.evaluate : function(result) {
					if (status) {
						if (p && p.on && p.on.exit) {
							p.on.exit({
								status: status,
								arguments: args
							})
						}
						throw new Error("Exit status: " + status);
					} else {
						return {
							status: status,
							arguments: args
						};
					}
				};
				return evaluate({
					status: status,
					arguments: args
				});
			};
			return rv;
		});

		/**
		 * @param { string } pathname
		 */
		var _open = function(pathname) {
			var location = $context.library.file.Location.from.os(pathname);
			var _jarFile = new Packages.java.util.jar.JarFile(
				location.pathname
			);
			return _jarFile;
		};

		/** @type { slime.jrunscript.java.tools.Exports["jar"] } */
		var jar = (function() {
			var toScriptManifest = function(_manifest) {
				/** @type { slime.$api.fp.world.Reading<slime.jrunscript.java.tools.Exports["jar"]["manifest"]["world"]> } */
				var rv = {
					main: {},
					entries: {}
				};

				/**
				 *
				 * @param { object } rv
				 * @param { slime.jrunscript.native.java.util.jar.Attributes } _attributes
				 */
				var addManifestEntries = function(rv, _attributes) {
					var _entries = _attributes.entrySet().iterator();
					while(_entries.hasNext()) {
						var _entry = _entries.next();
						rv[String(_entry.getKey())] = String(_entry.getValue());
					}
				}

				addManifestEntries(rv.main, _manifest.getMainAttributes());

				var _entries = _manifest.getEntries();
				var _entriesEntries = _entries.entrySet();
				var _entriesIterator = _entriesEntries.iterator();
				while(_entriesIterator.hasNext()) {
					var _entriesEntry = _entriesIterator.next();
					var _name = _entriesEntry.getKey();
					/** @type { { [name: string]: string }} */
					var section = {};
					rv.entries[String(_name)] = section;
					addManifestEntries(section, _entriesEntry.getValue());
				}

				return rv;
			}

			var wo = {
				/** @type { slime.jrunscript.java.tools.Exports["jar"]["manifest"]["world"] } */
				manifest: function(o) {
					return function(e) {
						var _jarFile = _open(o.pathname);
						var _manifest = _jarFile.getManifest();

						return toScriptManifest(_manifest);
					}
				},
				/** @type { slime.jrunscript.java.tools.Exports["jar"]["entries"]["world"] } */
				entries: function(o) {
					return function(events) {
						var _jarFile = _open(o.pathname);
						var _iterator = _jarFile.stream().iterator();

						/** @type { slime.$api.fp.Mapping<slime.jrunscript.native.java.util.jar.JarEntry,slime.jrunscript.java.tools.jar.Entry> } */
						var entry = function(_entry) {
							if (_entry.isDirectory()) {
								return {
									path: String(_entry.getName()),
									directory: true
								}
							} else {
								return {
									path: String(_entry.getName()),
									directory: false,
									read: function(events) {
										var _input = _jarFile.getInputStream(_entry);
										return $context.library.io.InputStream.old.from.java(_input);
									}
								}
							}
						}

						/** @type { slime.$api.fp.Stream<slime.jrunscript.java.tools.jar.Entry> } */
						return function f() {
							return {
								next: (_iterator.hasNext()) ? $api.fp.Maybe.from.some(entry(_iterator.next())) : $api.fp.Maybe.from.nothing(),
								remaining: f
							}
						}
					}
				}
			};

			return {
				manifest: {
					world: wo.manifest,
					simple: $api.fp.world.Sensor.old.mapping({ sensor: wo.manifest })
				},
				entries: {
					world: wo.entries,
					simple: $api.fp.world.Sensor.old.mapping({ sensor: wo.entries })
				},
				Manifest: {
					from: {
						string: function(string) {
							var input = $context.library.io.InputStream.string.default(string);
							var _manifest = new Packages.java.util.jar.Manifest();
							_manifest.read(input.java.adapt());
							return toScriptManifest(_manifest);
						}
					}
				},
				Entry: {
					is: {
						/** @type { slime.jrunscript.java.tools.Exports["jar"]["Entry"]["is"]["file"] } */
						file: function(entry) {
							return !entry.directory;
						},
						/** @type { slime.jrunscript.java.tools.Exports["jar"]["Entry"]["is"]["directory"] } */
						directory: function(entry) {
							return entry.directory;
						}
					}
				}
			};
		})();

		/** @type { slime.jrunscript.java.tools.Exports["Jar"] } */
		var Jar = function(o) {
			var _peer = (function(o) {
				if (o.file) {
					return new Packages.java.util.jar.JarFile(
						o.file.pathname.java.adapt()
					);
				}
			})(o);

			this.manifest = (function() {
				var _manifest = _peer.getManifest();
				var _main = _manifest.getMainAttributes();
				var _entries = _main.entrySet().iterator();
				var rv = {
					main: {}
				};
				while(_entries.hasNext()) {
					var _entry = _entries.next();
					rv.main[String(_entry.getKey())] = String(_entry.getValue());
				}
				return rv;
			})();
		};

		var $exports = {
			javac: void(0),
			jar: jar,
			Jar: Jar
		};

		//	We do not want to pre-load the Java compiler as it is way too slow to do so.
		//	TODO	verify that this setup does not load it
		Object.defineProperty(
			$exports,
			"javac",
			{
				get: javac
			}
		);

		$export($exports);
	}
//@ts-ignore
)(Packages,$api,$context,$export);
