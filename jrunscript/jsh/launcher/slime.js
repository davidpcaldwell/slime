//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @this { slime.internal.jrunscript.bootstrap.Global<{ slime: slime.jsh.internal.launcher.Slime }> }
	 */
	function() {
		var Packages = this.Packages;
		var $$api = this.$api;

		/** @type { (p: any) => slime.jsh.internal.launcher.SlimeConfiguration } */
		function toSlimeConfiguration(p) {
			return p;
		}

		/** @type { slime.jsh.internal.launcher.SlimeConfiguration } */
		var configuration = toSlimeConfiguration($$api.slime);

		//	Provide better implementation that uses Java delegate, replacing pure JavaScript version supplied by api.js
		if (typeof(Packages.inonit.script.runtime.io.Streams) == "function") {
			$$api.io.copy = (function() {
				var delegate;

				return function(i,o) {
					if (!delegate) {
						delegate = new Packages.inonit.script.runtime.io.Streams();
					}
					delegate.copy(i,o);
				}
			})();
		}

		//	TODO	not sure this makes any sense at all; why are we replacing the classpath from which Rhino can be loaded in this
		//			circumstance? How is this used?
		if (Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath")) {
			//	TODO	hard-coded assumption that this is file
			$$api.engine.rhino.classpath = function() {
				return new Packages.java.io.File(Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath"))
			};
		}

		$$api.slime = (function(was) {
			/** @type { slime.jsh.internal.launcher.Slime } */
			var rv = {
				launcher: void(0),
				home: void(0),
				settings: void(0),
				Src: function(src) {
					/** @type { Partial<slime.jsh.internal.launcher.Slime["src"]> } */
					var rv;
					if (src.file) {
						rv = (function() {
							var File = function(path) {
								$$api.debug("File: path = " + path + " src.file=" + src.file);
								return new Packages.java.io.File(src.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile().getParentFile(), path);
							}

							var getSourceFilesUnderFile = function getSourceFilesUnderFile(dir,rv) {
								if (typeof(rv) == "undefined") {
									rv = [];
								}
								if (typeof(dir) == "string") {
									dir = File(dir);
								}
								var files = dir.listFiles();
								//$api.log("files: " + files.length);
								if (!files) return [];
								for (var i=0; i<files.length; i++) {
									if (files[i].isDirectory() && String(files[i].getName()) != ".hg") {
										getSourceFilesUnderFile(files[i],rv);
									} else {
										if (files[i].getName().endsWith(".java")) {
											rv.push(files[i]);
										}
									}
								}
								return rv;
							}

							return {
								toString: function() {
									return src.file.getAbsoluteFile().getParentFile().getParentFile().getParentFile().getParentFile().toString();
								},
								File: File,
								//	TODO	it appears that this method is equivalent to File, should test that
								getFile: function(path) {
									return src.resolve("../../../" + path).file;
								},
								getSourceFilesUnder: function(dir) {
									return getSourceFilesUnderFile(dir, []);
								}
							}
						})()
					} else {
						rv = (function() {
							var base = new Packages.java.net.URL(src.url, "../../../");

							var bitbucketGetSourceFilesUnder = function(url,rv) {
								//	Bitbucket raw URLs allow essentially listing the directory with a newline-delimited list of names,
								//	with directories ending with /.
								var string = $$api.engine.readUrl(url.toExternalForm());
								var lines = string.split("\n");
								for (var i=0; i<lines.length; i++) {
									if (/\/$/.test(lines[i])) {
										getSourceFilesUnder(new Packages.java.net.URL(url,lines[i]), rv);
									} else {
										if (/\.java$/.test(lines[i])) {
											rv.push(new Packages.java.net.URL(url, lines[i]));
										}
									}
								}
							}

							/**
							 *
							 * @param { slime.jrunscript.native.java.net.URL } url
							 * @param { slime.jrunscript.native.java.net.URL[] } rv
							 */
							var getSourceFilesUnder = function(url,rv) {
								var list = $$api.github.archives.getSourceFilesUnder(url);
								var endsWithSlash = function(url) {
									return /\/$/.test(url.toString());
								};
								var isJava = function(url) {
									return /\.java$/.test(url.toString());
								}
								list.forEach(function(url) {
									if (endsWithSlash(url)) {
										getSourceFilesUnder(url,rv);
									} else {
										if (isJava(url)) {
											rv.push(url);
										}
									}
								});
							}

							return {
								toString: function() {
									return base.toExternalForm();
								},
								getSourceFilesUnder: function(path) {
									var under = new Packages.java.net.URL(base, path);
									var rv = [];
									getSourceFilesUnder(under,rv);
									return rv;
								}
							}
						})()
					}

					rv.getPath = function(path) {
						$$api.debug("getPath: " + path);
						var resolved = src.resolve("../../../" + path);
						//	TODO	this needs simplification
						if (resolved == null) {
							if (this.File) {
								return String(this.File(path).getAbsolutePath().toString())
							} else {
								$$api.debug("getPath return null for: " + path);
								return null;
							}
						} else {
							return resolved.toString();
						}
					}

					/**
					 *
					 * @param { Partial<slime.jsh.internal.launcher.Slime["src"]> } partial
					 * @returns { slime.jsh.internal.launcher.Slime["src"] }
					 */
					function complete(partial) {
						/**
						 * @type { (partial: Partial<slime.jsh.internal.launcher.Slime["src"]>) => partial is slime.jsh.internal.launcher.Slime["src"] } partial
						 */
						function isComplete(partial) {
							return true;
						}
						if (isComplete(partial)) return partial;
						throw new Error("Unreachable");
					}

					return complete(rv);
				}
			};
			if (was && was.built) {
				rv.launcher = new function() {
					this.getClasses = function() {
						return new Packages.java.io.File($$api.script.file.getParentFile(), "jsh.jar");
					};

					this.compile = void(0);
				};

				rv.home = $$api.script.file.getParentFile();
			} else {
				var isSourceFile = $$api.script.file && String($$api.script.file.getParentFile().getName()) == "launcher";
				var isHttp = $$api.script.url && /^http/.test(String($$api.script.url.getProtocol()));

				if (isSourceFile || isHttp) {
					rv.src = rv.Src($$api.script);
				}

				rv.launcher = new function() {
					//	Exposed because it is used by jsh build script
					this.compile = function(p) {
						var src = p.src || rv.src;
						if (!src) throw new Error("No src: " + $$api.script);
						var to = (p && p.to) ? p.to : $$api.io.tmpdir();
						var args = [
							"-Xlint:deprecation",
							"-Xlint:unchecked",
							"-d", to,
							"-sourcepath", src.getPath("rhino/system/java") + Packages.java.io.File.pathSeparator + src.getPath("jrunscript/jsh/launcher/java"),
							src.getPath("jrunscript/jsh/launcher/java/inonit/script/jsh/launcher/Main.java")
						];

						//	Thinking maybe the below line was put in when the bug was introduced into getPath, which caused it to
						//	search relative to jrunscript/ rather than the top-level directory, which nevertheless worked because
						//	it resulted from moving jsh under jrunscript in the first place, so the only files the implementation
						//	would no longer find were these (because it would look under jrunscript/rhino/system/java isntead).
						//
						//	So commenting out to see what happens
						//args.push.apply(args,rv.src.getSourceFilesUnder(rv.src.File("rhino/system/java")));

						$$api.java.install.compile(args);

						if (!p || !p.to) return to;
					};

					this.getClasses = function() {
						return this.compile();
					}
				}
			}

			rv.settings = (function() {
				/** @typedef { { launcher: boolean, loader: boolean, loaderVmArguments?: (value: string) => string[] } } Definition */

				/** @typedef { { set: (value: string) => void, default: (f: () => string) => void, get: () => string, loaderVmArguments: () => string[], getLoaderProperty: () => string } } Setting */

				/** @type { Record<string, Setting> } */
				var all = {};

				/**
				 * Returns a string representing the explicit value of a named setting (for example, `foo.bar.baz`); uses first system
				 * properties and then environment variables (for example, `FOO_BAR_BAZ`) to locate the value.
				 *
				 * @param name The period-delimited name of a setting.
				 *
				 * @returns The string value of the setting, or `null` if the setting was not explicitly provided.
				 */
				var explicit = function(name) {
					if (Packages.java.lang.System.getProperty(name) !== null) {
						return String(Packages.java.lang.System.getProperty(name));
					}
					var ename = name.replace(/\./g, "_").toUpperCase();
					if (Packages.java.lang.System.getenv(ename) !== null) {
						return String(Packages.java.lang.System.getenv(ename));
					}
					return null;
				};

				/**
				 * @param { string } name
				 * @param { Definition } definition
				 * @returns { Setting }
				 */
				var Setting = function(name,definition) {
					/** @type { string } */
					var value;

					/** @type { () => string } */
					var getDefault;

					/**
					 * @type { () => string }
					 */
					var get = function() {
						if (!all[name]) {
							throw new Error("Cannot read: " + name);
						}
						var specified = explicit(name);
						if (specified !== null) {
							return specified;
						}
						if (value) {
							return value;
						}
						if (getDefault) {
							return getDefault();
						}
					}

					var rv = {
						set: function(v) {
							value = v;
						},
						default: function(f) {
							getDefault = f;
						},
						get: function() {
							if (definition.launcher) return get();
							return void(0);
						},
						loaderVmArguments: function() {
							var loaderVmArguments = definition.loaderVmArguments || function(v) { return /** @type { string[] }*/([]); };
							var value = get();
							var args = loaderVmArguments(value);
							return args;
						},
						getLoaderProperty: function() {
							if (definition.loader) return get();
							return void(0);
						}
					};

					all[name] = rv;

					return rv;
				};

				var LAUNCHER = {
					launcher: true,
					loader: false
				};
				var LOADER = {
					launcher: false,
					loader: true,
				};
				var BOTH = {
					launcher: true,
					loader: true
				};
				var LOADER_VM = function(f) {
					return {
						launcher: false,
						loaderVmArguments: function(value) {
							if (!value) return [];
							return f(value);
						},
						loader: false
					}
				}

				//	TODO	audit all environment variables and properties accessed in launcher and loader

				Setting(
					"jsh.debug.jdwp",
					LOADER_VM(function(value) {
						if (value == "false") {
							return [];
						} else {
							return ["-agentlib:jdwp=" + value];
						}
					})
				);

				//	Used by launcher to help decide on engine and also to launch profiler agent for Rhino profiler; used by loader
				//	to configure script debugger
				Setting("jsh.debug.script", BOTH);

				Setting("jsh.jvm.options",
					LOADER_VM(function(value) {
						return value.split(" ");
					})
				);

				Setting("jsh.log.java.properties",
					LOADER_VM(function(value) {
						return ["-Djava.util.logging.config.file=" + value];
					})
				);

				//	Used in launcher for engine selection; we want this value to be available in the loader also
				Setting("jsh.engine", BOTH);

				//	Used in launcher for engine selection; we want this value to be available in the loader also, particularly for
				//	launching subshells
				Setting("jsh.engine.rhino.classpath", BOTH);

				//	We don't need this here, but the loader needs it to configure Rhino
				Setting("jsh.engine.rhino.optimization", LOADER);

				//	TODO	we need to figure out a better solution if the caller sets `java.io.tmpdir` on the launcher; it would
				//			seem a little counterintuitive that the loader would not respect it

				//	BUT if we do simply pass through `java.io.tmpdir` and just share it between the two, then you cannot set it via
				//	an environment variable (like JAVA_IO_TMPDIR) because the launcher VM will already have a default java.io.tmpdir
				//	set by the JVM itself, so the environment variable will have no effect.

				//	So for now we use a different property, and it will be used only by the loader

				//	We pass this through to the loader as the loader temporary file location
				Setting("jsh.shell.tmpdir", LOADER_VM(function(value) {
					return ["-Djava.io.tmpdir=" + value];
				})),

				//	Sent from launcher to loader so that loader can locate the shell implementation
				Setting("jsh.shell.src", LOADER);

				//	Used by launcher to locate engine; used by loader to find shell tools like Node, also made available to scripts
				Setting("jsh.shell.lib", BOTH);

				//	This setting is calculated by the loader itself by examining the Java code source.
				//	TODO	revisit this
				// Setting("jsh.shell.home", BOTH);

				//	This setting is calculated by the loader itself by examining the system resources.
				//	TODO	revisit this
				//	TODO	but is the launcher even used by packaged applications?
				// Setting("jsh.shell.packaged", BOTH);

				//	Used by launcher to compile the shell and by loader to load the classes
				Setting("jsh.shell.classes", BOTH);

				//	Used to configure launcher in subshells, it appears, to that it does not have to recompile classes?
				//	If that's right, both launcher and loader need it
				//	TODO	figure this out
				Setting("jsh.shell.classpath", BOTH);

				//	Used to configure the profiler using a -javaagent: VM argument; logically might be possible to implement as
				//	LOADER_VM, but the code is not organized that way yet
				Setting("jsh.shell.profiler", LAUNCHER);

				//	Determines whether the launcher emits debugging output.
				//	TODO	could convert this to use standard Java logging configuration, though that would be much more verbose;
				//			this could also be a shortcut for that mechanism, but it seems like the Java logging APIs don't make it
				//			super-easy to install a configuration at runtime
				Setting("jsh.launcher.debug", LAUNCHER);

				//	Intended to be used to select configuration for loader, whether to use separate VM or not. Unclear whether it
				//	is actually used currently
				//	TODO	figure it out
				Setting("jsh.shell.container", LAUNCHER);

				//	Allows specification of the Java to use. Loader does not need this; can use `java.home`.
				Setting("jsh.java.home", LAUNCHER);

				//	Allows specifying to the launcher not to pass proxy-related properties through to the loader; otherwise
				//	properties like http.proxyHost are passed through
				//	TODO	should modify the above to use the mechanism we are already using here; if we specified http.proxyHost
				//			as BOTH we could remove the code that is manually doing this, though we might need to support the
				//			jsh.loader.noproxy use case with some kind of additional construct; possibly we could have the concept
				//			of setting a property to `null` in the Setting implementation
				Setting("jsh.loader.noproxy", BOTH);

				//	Used to configure GitHub API access in the loader. May not be necessary now that we know how to run mock HTTPS
				//	servers.
				//	TODO	figure out whether this can be removed. Seems like yes, since no test code seems to set it, so it is
				//			possibly unused
				Setting("jsh.github.api.protocol", LOADER);

				/**
				 * @type { slime.jsh.internal.launcher.Slime["settings"]["set"] }
				 */
				var set = function(name,value) {
					all[name].set(value);
				}

				/**
				 * @type { slime.jsh.internal.launcher.Slime["settings"]["default"] }
				 */
				var setDefault = function(name,value) {
					if (typeof(value) == "undefined") return;
					/** @type { () => string } */
					var getValue;
					if (typeof(value) != "function") {
						getValue = (function(rv) {
							return function() {
								return rv;
							}
						})(value);
					} else {
						getValue = value;
					}
					if (!all[name]) throw new Error("Cannot set default for " + name);
					all[name].default(getValue);
				};

				//	If SLIME source location not specified, and we can determine it, supply it to the shell
				if (rv.src) setDefault("jsh.shell.src", String(rv.src));

				/**
				 * @type { slime.jsh.internal.launcher.Slime["settings"]["get"] }
				 */
				var get = function(name) {
					if (!all[name]) {
						throw new Error("Cannot read: " + name);
					}
					return all[name].get();
				}

				//	Added to VM arguments for loader VM
				/**
				 * @type { () => string[] }
				 */
				var getLoaderVmArguments = function() {
					/** @type { string[] } */
					var rv = [];
					for (var x in all) {
						rv = rv.concat(all[x].loaderVmArguments());
					}
					return rv;
				};

				/**
				 * @type { slime.jsh.internal.launcher.Slime["settings"]["sendPropertiesTo"] }
				 */
				var sendPropertiesTo = function(o) {
					for (var x in all) {
						var value = all[x].getLoaderProperty();
						if (value) {
							o.systemProperty(x,value);
						}
					}
				};

				/**
				 * @type { slime.jsh.internal.launcher.Slime["settings"]["applyTo"] }
				 */
				var applyTo = function(command) {
					getLoaderVmArguments().forEach(function(arg) {
						command.vm(arg);
					});
					sendPropertiesTo(command);
				}

				return {
					set: set,
					default: setDefault,
					get: get,
					sendPropertiesTo: sendPropertiesTo,
					applyTo: applyTo
				};
			})();

			return rv;
		})(configuration);
	}
//@ts-ignore
).call(this);
