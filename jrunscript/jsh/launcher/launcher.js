//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @this { slime.jsh.internal.launcher.Global }
	 */
	function() {
		//	NOTES ABOUT UNSUPPORTED PLATFORMS
		//	=================================
		//
		//	OLDER JAVA
		//
		//	To backport to 1.4 or lower, some mechanism would be needed to enumerate the environment variables. At one time this was done
		//	with /usr/bin/env on UNIX and was not done at all on Windows (except Cygwin; see below).
		//
		//	OLDER RHINO
		//
		//	Old versions of Rhino used Apache XMLBeans to implement E4X. If $JSH_HOME/lib/xbean.jar is present, could add it and
		//	$JSH_HOME/lib/jsr173_1.0_api.jar to the "Rhino classpath" along with Rhino proper.
		//
		//	CYGWIN
		//
		//	Cygwin was once a supported platform, but it is unsupported for now. These comments pertain to the previous Cygwin
		//	implementation to assist if it is resurrected.
		//
		//	*	Obviously many settings that are file paths need to be converted from, or to, Cygwin format, or to Cygwin format, and a
		//		design would need to be developed for that purpose
		//	*	Packaged applications for Cygwin may have the Cygwin paths helper at $jsh/bin/inonit.script.runtime.io.cygwin.cygpath.exe,
		//		and may need to create a Cygwin library directory, copy the executable to that directory, and specify that directory to
		//		the shell as some kind of property (at one time known as JSH_LIBRARY_NATIVE).
		//	*	Non-packaged applications probably need to specify the equivalent of JSH_LIBRARY_NATIVE as well, to get the Cygwin paths
		//		helper.
		//	*	Cygwin shells probably should use Cygwin /tmp as the default temporary directory (if jsh.shell.tmpdir is not specified)
		//	*	Cygwin shells probably should accept the script argument in Cygwin format
		//	*	If directives continue to be supported, CLASSPATH directives should probably be accepted in Cygwin format
		//	*	If Cygwin is present, should send its root directory as cygwin.root system property
		//	*	If Cygwin is present and native library directory is present, send the inonit.script.runtime.io.cygwin.cygpath.exe full
		//		path as cygwin.paths property. Otherwise, check to see if the Cygwin file system implementation emits a warning without the
		//		cygwin.paths property; if it does not, possibly add one here.

		//	NOTES ABOUT REMOVED FEATURES
		//	============================
		//
		//	DIRECTIVES
		//
		//	At one time, a script could use "directives," which used lines beginning with '#' or '//#' to specify certain kinds of startup
		//	configuration:
		//		*	//#CLASSPATH </dir1:/dir2> added /dir1 and /dir2 to the script classpath
		//		*	//#JVM_OPTION added an option to be used when starting the Java VM.
		//		*	//#JDK_LIBRARY added a JDK library to the classpath (usually tools.jar).
		//
		//	This feature was removed for several reasons:
		//		*	It was never tested with CoffeeScript and would have complicated the implementation of CoffeeScript or similar
		//			preprocessors
		//		*	There are easier, more robust ways to do each of these things:
		//			*	For CLASSPATH, there is now jsh.loader.java.add()
		//			*	For	JDK_LIBRARY, one can use a combination of jsh.shell.java.home and jsh.loader.java.add
		//				TODO	better way to locate JDK libraries, perhaps with jsh.shell property
		//			*	For JVM_OPTION, or others if they really need to be loaded at startup, one can simply have the script re-launch
		//				itself as a subprocess using the desired configuration via jsh.shell.run, jsh.shell.java, or jsh.shell.jsh.
		//
		//	PATH SEARCHING
		//
		//	If a local, non-absolute path to a script was given, and did not resolve to a specific script relative to the working directory,
		//	the shell used to search the PATH environment variable for scripts at the given relative path to execute. This feature does not
		//	seem to have been useful, and scripts intended to be used as "commands" would typically be wrapped in bash scripts, which do
		//	have the PATH semantics.
		//
		//	SHELL CLASSPATH
		//
		//	At one time, it was possible to configure the "shell classpath" -- to specify the Java classes used to help implement the shell.
		//	However, there are no known use cases for this configurability, so the functionality was removed.

		//	TODO	can this be run with Java 6/7 jrunscript?
		//
		//	TODO	create semi-automated verify process that includes non-automatable features (like debugger)
		//
		//	TODO	Prefer the client VM unless -server is specified (and do not redundantly specify -client)
		//
		//	TODO	At one point, was investigating using jjs as Nashorn launcher; is this still a good idea? If so, would using the
		//			Rhino shell as main make sense for the Rhino case?
		//
		//	TODO	Implement Rhino profiler; probably needs to move to main.js
		//
		//		} else if (env.JSH_SCRIPT_DEBUGGER == "profiler" || /^profiler\:/.test(env.JSH_SCRIPT_DEBUGGER)) {
		//			//	TODO	there will be a profiler: version of this variable that probably allows passing a filter to profile only
		//			//			certain classes and/or scripts; this should be parsed here and the filter option passed through to the agent
		//			//	from settings:
		//			//	this.profiler = JSH_HOME.getFile("tools/profiler.jar");
		//			if (settings.get("profiler") && JSH_SHELL_CONTAINER == "jvm") {
		//				var withParameters = /^profiler\:(.*)/.exec(env.JSH_SCRIPT_DEBUGGER);
		//				if (withParameters) {
		//					command.add("-javaagent:" + settings.get("profiler").path + "=" + withParameters[1]);
		//				} else {
		//					command.add("-javaagent:" + settings.get("profiler").path);
		//				}
		//			} else {
		//				//	TODO	allow explicit setting of profiler agent location when not running in ordinary built shell
		//				//	emit warning message?
		//			}
		//		}
		//
		//	TODO	Provide runtime access to plugin path, with jsh.shell.jsh.plugins?
		var Packages = this.Packages;

		try {
			var $$api = this.$api;
			if (!this.$api.slime) {
				//	This can occur when the script is called from a packaged script
				//	TODO	figure out how and why, and whether the packaged script should invoke slime.js itself instead
				var slime = $$api.script.resolve("slime.js");
				slime.load();
				$$api.log("Loaded slime.js: src=" + $$api.slime.src);
			}

			if ($$api.slime.setting("jsh.launcher.debug")) {
				$$api.debug.on = true;
				$$api.debug("debugging enabled");
			}

			$$api.jsh = {
				exit: void(0),
				engine: void(0),
				engines: void(0),
				shell: void(0),
				Built: void(0),
				Unbuilt: void(0),
				Packaged: void(0),
				Classpath: void(0)
			};

			$$api.jsh.exit = $$api.engine.resolve({
				rhino: function(status) {
					var _field = Packages.java.lang.Class.forName("org.mozilla.javascript.tools.shell.Main").getDeclaredField("exitCode");
					_field.setAccessible(true);
					if (status === null) {
						_field.set(null, new Packages.java.lang.Integer(Packages.inonit.script.jsh.launcher.Engine.Rhino.NULL_EXIT_STATUS));
					} else {
						_field.set(null, new Packages.java.lang.Integer(status));
					}
				},
				nashorn: function(status) {
					if (status !== null) {
						Packages.java.lang.System.exit(status);
					}
				},
				//	TODO	the below is untested
				graal: function(status) {
					if (status !== null) {
						Packages.java.lang.System.exit(status);
					}
				}
			});

			$$api.jsh.engines = {
				rhino: {
					main: "inonit.script.jsh.Rhino",
					resolve: function(o) {
						return o.rhino;
					}
				},
				nashorn: {
					main: "inonit.script.jsh.Nashorn",
					resolve: function(o) {
						return o.nashorn;
					}
				},
				graal: {
					main: "inonit.script.jsh.Graal",
					resolve: function(o) {
						return o.graal;
					}
				}
			};

			$$api.jsh.engine = (function() {
				var engines = $$api.jsh.engines;
				if ($$api.slime.settings.get("jsh.engine")) {
					return (function(setting) {
						return engines[setting];
					})($$api.slime.settings.get("jsh.engine"));
				}
				return $$api.engine.resolve(engines);
			})();

			var Classpath = function(_urls) {
				var colon = String(Packages.java.io.File.pathSeparator);

				this.append = function(classpath) {
					this._urls.push.apply(this._urls,classpath._urls);
				}

				this._urls = (function(_urls) {
					var rv = [];
					if (_urls) {
						for (var i=0; i<_urls.length; i++) {
							rv.push(_urls[i]);
						}
					}
					return rv;
				})(_urls);

				var files = function() {
					var rv = [];
					for (var i=0; i<this._urls.length; i++) {
						var pathname;
						if (!this._urls[i].getProtocol) throw new Error("Not URL: " + this._urls[i]);
						if (String(this._urls[i].getProtocol()) != "file") {
							// var tmpdir = new Directory(String($$api.io.tmpdir().getCanonicalPath()));

							// var rhino = ClassLoader.getSystemResourceAsStream("$jsh/rhino.jar");
							// if (rhino) {
							// 	$$api.debug("Copying rhino ...");
							// 	var rhinoCopiedTo = tmpdir.getFile("rhino.jar");
							// 	var writeTo = rhinoCopiedTo.writeTo();
							// 	$$api.io.copy(rhino,writeTo);
							// }
							throw new Error("Not a file: " + this._urls[i]);
						} else {
							pathname = new Packages.java.io.File(this._urls[i].toURI()).getCanonicalPath();
						}
						rv.push(pathname);
					}
					return rv;
				};

				this.local = function() {
					return files.call(this).join(colon);
				}
			};

			//	TODO	Merge below with above
			$$api.jsh.Classpath = Classpath;

			$$api.script.resolve("javac.js").load();

			/** @type { (p: { setting: string, rhino?: slime.jrunscript.native.java.net.URL[] }) => slime.jsh.internal.launcher.Libraries } */
			var Libraries = function(p) {
				var setting = p.setting;
				// TODO: this same approach for locating the lib directory should be used in $$api.jsh.Built, no?
				var lib = (function() {
					//	TODO	setting can be null because $$api.script.resolve() doesn't find local/jsh/lib online; should refactor
					if (!setting) return null;
					if (/^http/.test(setting)) {
						return { url: setting }
					} else {
						var file = new Packages.java.io.File(setting);
						if (!file.exists()) file.mkdirs();
						return { file: file };
					}
				})();

				var rhino = function(version) {
					if (p.rhino) return p.rhino;
					if ($$api.slime.settings.get("jsh.engine.rhino.classpath")) {
						return [new Packages.java.io.File($$api.slime.settings.get("jsh.engine.rhino.classpath")).toURI().toURL()];
					} else if (setting && lib.file) {
						var rhinoJar = new Packages.java.io.File(lib.file, "js.jar");
						if (rhinoJar.exists()) {
							return [rhinoJar.toURI().toURL()];
						}
					}
				};

				var nashorn = (function() {
					if (setting && lib.file) {
						if (new Packages.java.io.File(lib.file, "nashorn.jar").exists()) {
							$$api.debug("nashorn.jar found");
							return $$api.nashorn.dependencies.jarNames.concat(["nashorn.jar"]).map(function(filename) {
								return new Packages.java.io.File(lib.file, filename).toURI().toURL();
							});
						}
					}
				})();

				return {
					rhino: rhino,
					nashorn: nashorn
				}
			}

			//	TODO	p.rhino argument is used by callers right now to specify Rhino over this implementation's objections but
			//			this will be going away; see #1961
			/**
			 * @type { slime.jsh.internal.launcher.Jsh["Unbuilt"] }
			 */
			$$api.jsh.Unbuilt = function(p) {
				if (!p) throw new TypeError("Required: arguments[0]");

				var src = p.src || $$api.slime.src;

				var File = Packages.java.io.File;

				var toString = function() {
					return "Unbuilt: src=" + src + " lib.url=" + ( p.lib ? p.lib.url : void(0) ) + "lib.file=" + (p.lib ? p.lib.file : void(0)) + " rhino=" + p.rhino;
				}

				$$api.slime.settings.default(
					"jsh.shell.lib",
					src.getPath("local/jsh/lib")
				);

				var libraries = Libraries({
					setting: $$api.slime.settings.get("jsh.shell.lib"),
					rhino: p.rhino
				})

				var lib = p.lib;

				var graal = null;
				if (lib && lib.file && new File(lib.file, "graal").exists()) {
					graal = new File(lib.file, "graal");
				}

				var profiler = (function() {
					if ($$api.slime.settings.get("jsh.shell.profiler")) {
						return new Packages.java.io.File($$api.slime.settings.get("jsh.shell.profiler"));
					}
				})();

				var installationSpecifiedRhino = p.rhino;

				//	As of bbc58b79a49b6b5ae2b56c48486e85cbd1e31eb5, used by jsh/etc/build.jsh.js, as well as shellClasspath method below
				/**
				 * @type { ReturnType<slime.jsh.internal.launcher.Jsh["Unbuilt"]>["compileLoader"] }
				 */
				var compileLoader = function(p) {
					var rhino = (
						function() {
							//	Right now, to preserve existing build.jsh.js behavior, we defer to the value for Rhino specified in
							//	the shell constructor. This may change as we revisit the design for built shells.
							if (installationSpecifiedRhino) return installationSpecifiedRhino;

							var target = (p.target) ? p.target : $$api.java.getMajorVersion();
							var rhinoVersion = $$api.rhino.version(target);
							return libraries.rhino(rhinoVersion);
						}
					)();

					//	fix things up for what the below is expecting, though I'm sure it won't look like this as we refactor
					if (rhino && !rhino.length) rhino = null;

					var isGraalCompatible = Boolean(p.source >= 17 && p.target >= 17)
					var classpath = new Classpath();
					if (rhino && rhino.length) classpath.append(new Classpath(rhino));
					if (graal && isGraalCompatible) {
						var _polyglotLibraries = new Packages.java.io.File(graal, "lib/polyglot").listFiles();
						var polyglotLibraries = [];
						for (var i=0; i<_polyglotLibraries.length; i++) {
							polyglotLibraries.push(_polyglotLibraries[i]);
						}
						classpath.append(new Classpath(polyglotLibraries.map(function(_file) { return _file.toURI().toURL(); })));
					}
					if (classpath._urls.length == 0) classpath = null;

					//var rhino = (this.rhino && this.rhino.length) ? new Classpath(this.rhino) : null;
					// TODO: below will probably eventually be a classpath, but it may be more complex if graal javac is required to compile
					// graal classes
					// TODO: should we be compiling classes for engines we are not using?
					//var graal = this.graal;
					if (!p) p = {};
					if (!p.to) p.to = $$api.io.tmpdir();
					var toCompile = src.getSourceFilesUnder(src.File("loader/jrunscript/java"));
					if (rhino) toCompile = toCompile.concat(src.getSourceFilesUnder(src.File("loader/jrunscript/rhino/java")));
					if (graal && isGraalCompatible) toCompile = toCompile.concat(src.getSourceFilesUnder(src.File("loader/jrunscript/graal/java")));
					toCompile = toCompile.concat(src.getSourceFilesUnder(src.File("rhino/system/java")));
					toCompile = toCompile.concat(src.getSourceFilesUnder(src.File("jrunscript/jsh/loader/java")));
					if (rhino) toCompile = toCompile.concat(src.getSourceFilesUnder(src.File("jrunscript/jsh/loader/rhino/java")));
					if (graal && isGraalCompatible) toCompile = toCompile.concat(src.getSourceFilesUnder(src.File("jrunscript/jsh/loader/graal/java")));
					var classpathArguments = (classpath) ? ["-classpath", classpath.local()] : [];
					var targetArguments = (p && p.target) ? ["-target", String(p.target)] : [];
					var sourceArguments = (p && p.source) ? ["-source", String(p.source)] : [];
					var args = [
						"-Xlint:unchecked",
						"-Xlint:deprecation",
					].concat(sourceArguments).concat(targetArguments).concat([
						"-d", String(p.to.getAbsolutePath())
					]).concat(classpathArguments);
					//	TODO	we used to use .concat(toCompile) but that does not work under Nashorn 8u45, which is presumably a Nashorn
					//			bug
					for (var i=0; i<toCompile.length; i++) {
						args.push(String(toCompile[i].getCanonicalPath()));
					}
					$$api.java.install.compile(args);
					return p.to;
				};

				/** @type { slime.jsh.internal.launcher.Installation["shellClasspath"] } */
				var shellClasspath = function(p) {
					if (!src) throw new Error("Could not detect SLIME source root for unbuilt shell.")
					var setting = $$api.slime.settings.get("jsh.shell.classes");
					/** @type { slime.jrunscript.native.java.io.File } */
					var LOADER_CLASSES = (setting) ? new Packages.java.io.File(setting, "loader") : $$api.io.tmpdir();
					if (!LOADER_CLASSES.exists()) LOADER_CLASSES.mkdirs();
					if (src.File) {
						if (setting && LOADER_CLASSES.exists() && new Packages.java.io.File(LOADER_CLASSES, "inonit/script/engine/Code.class").exists()) {
							$$api.debug("Found already-compiled files.");
						} else {
							this.compileLoader({
								to: LOADER_CLASSES,
								source: p.source,
								target: p.target
							});
						}
					} else {
						(
							function() {
								var rhino = (
									function() {
										var jdk = $$api.java.getMajorVersion();
										var version = $$api.rhino.version(jdk);
										return libraries.rhino(version);
									}
								)();

								var rhinoClasspath = (rhino && rhino.length) ? new Classpath(rhino) : null;

								$$api.log("Looking for loader source files under " + src + " ...");

								var getLoaderSourceFiles = function(p) {
									var directories = [];
									directories.push("loader/jrunscript/java/");
									if (p.rhino) directories.push("loader/jrunscript/rhino/");
									directories.push("rhino/system/java/");
									directories.push("jrunscript/jsh/loader/java/");
									if (p.rhino) directories.push("jrunscript/jsh/loader/rhino/");
									var toCompile = [];
									directories.forEach(function(directory) {
										if (p.on && p.on.start) {
											p.on.start({
												path: directory,
												current: arguments[1]+1,
												total: arguments[2].length
											});
										}
										toCompile = toCompile.concat(p.list(directory));
										if (p.on && p.on.end) {
											p.on.end({
												path: directory,
												current: arguments[1]+1,
												total: arguments[2].length
											});
										}
									});
									return toCompile;
								}

								var toCompile = getLoaderSourceFiles({
									list: function(string) {
										return src.getSourceFilesUnder(string);
									},
									rhino: rhinoClasspath,
									on: {
										start: function(e) {
											$$api.log("Checking under " + e.path + " (" + e.current + "/" + e.total + ")");
										},
										end: function(e) {
											$$api.log("Done checking under " + e.path + " (" + e.current + "/" + e.total + ")");
										}
									}
								});
								$$api.java.compile({
									classpath: (rhinoClasspath) ? rhinoClasspath._urls : [],
									destination: LOADER_CLASSES,
									files: toCompile
								});
							}
						)();
					}
					$$api.debug("Returning shellClasspath: " + LOADER_CLASSES.toURI().toURL());
					return [LOADER_CLASSES.toURI().toURL()];
				};

				return {
					toString: toString,
					libraries: libraries,
					graal: graal,
					profiler: profiler,
					shellClasspath: shellClasspath,
					compileLoader: compileLoader
				};
			};

			/**
			 * @type { slime.jsh.internal.launcher.Jsh["Built"] }
			 */
			$$api.jsh.Built = function(home) {
				var toString = function() {
					return "Built: home=" + home;
				}

				$$api.slime.settings.default(
					"jsh.shell.lib",
					String(new Packages.java.io.File(home, "lib").getCanonicalPath())
				);

				var libraries = Libraries({
					setting: $$api.slime.settings.get("jsh.shell.lib"),
				});

				//	TODO	should we allow Contents/Home here?
				var graal = null;
				if (new Packages.java.io.File(home, "lib/graal").exists()) {
					graal = new Packages.java.io.File(home, "lib/graal");
				}

				var profiler = null;
				if (new Packages.java.io.File(home, "tools/profiler.jar").exists()) {
					profiler = new Packages.java.io.File(home, "tools/profiler.jar");
				}

				var shellClasspath = function() {
					return [new Packages.java.io.File(home, "lib/jsh.jar").toURI().toURL()];
				}

				return {
					toString: toString,
					libraries: libraries,
					graal: graal,
					profiler: profiler,
					shellClasspath: shellClasspath
				}
			};

			$$api.jsh.Packaged = function(file) {
				this.packaged = file;

				//	TODO	test and enable (and document) if this works
				if (false) this.profiler = (function() {
					if ($$api.slime.settings.get("jsh.shell.profiler")) {
						return new Packages.java.io.File($$api.slime.settings.get("jsh.shell.profiler"));
					}
				})();

				this.shellClasspath = function() {
					return [file.toURI().toURL()];
				};
			};

			//	TODO	it seems like the below should migrate to main.js where similar code is already present, and packaged applications
			//			should launch that script
			if (Packages.java.lang.System.getProperties().get("jsh.launcher.shell") && Packages.java.lang.System.getProperties().get("jsh.launcher.shell").getPackaged()) {
				$$api.jsh.shell = new (function(peer) {
					var getRhinoClasspath = function() {
						var classpath = peer.getRhinoClasspath();
						if (classpath) {
							return new Classpath(classpath);
						} else {
							return null;
						}
					};

					var shell = (function(peer) {
						if (peer.getPackaged()) {
							$$api.debug("Setting packaged shell: " + String(peer.getPackaged().getCanonicalPath()));
							return new $$api.jsh.Packaged(peer.getPackaged());
						} else {
							throw new Error("No getPackaged() in " + peer);
						}
					})(peer);

					if (shell.home) {
						this.home = String(shell.home.getCanonicalPath());
					}
					if (shell.packaged) {
						this.packaged = String(shell.packaged.getCanonicalPath());
					}

					this.rhino = (getRhinoClasspath()) ? getRhinoClasspath().local() : null;

					this.classpath = function() {
						var rv = new Classpath();

						$$api.jsh.engine.resolve({
							rhino: function() {
								rv.append(getRhinoClasspath());
							},
							nashorn: function() {
							}
						})();

						rv.append(new Classpath(shell.shellClasspath()));

						return rv;
					};
				})(Packages.java.lang.System.getProperties().get("jsh.launcher.shell"));

				if ($$api.arguments.length == 0 && !$$api.jsh.shell.packaged) {
					$$api.console("Usage: " + $$api.script.file + " <script-path> [arguments]");
					//	TODO	should replace the below with a mechanism that uses setExitStatus, adding setExitStatus for Rhino throwing a
					//			java.lang.Error so that it is not caught
					$$api.jsh.exit(1);
				}

				$$api.debug("Launcher environment = " + JSON.stringify($$api.shell.environment, void(0), "    "));
				$$api.debug("Launcher working directory = " + Packages.java.lang.System.getProperty("user.dir"));
				$$api.debug("Launcher system properties = " + Packages.java.lang.System.getProperties());

				$$api.debug("Creating command ...");
				var command = new $$api.java.Command();

				var container = (function() {
					//	TODO	test whether next line necessary
					if ($$api.jsh.shell.packaged) return "jvm";
					if ($$api.slime.settings.get("jsh.shell.container")) return $$api.slime.settings.get("jsh.shell.container");
					return "classloader";
				})();
				if (container == "jvm") {
					command.fork();
				}

				(function vmArguments() {
					//	TODO	what about jsh.jvm.options? If it is set, the options may already have been applied by launcher and we may not need
					//			to add them and fork a VM; launcher could *unset* them, perhaps. Need to think through and develop test case
					if ($$api.jsh.shell.packaged) return;
					var rv = [];
					while($$api.arguments.length && $$api.arguments[0].substring(0,1) == "-") {
						command.vm($$api.arguments.shift());
					}
					return rv;
				})();

				//	Describe the shell
				if ($$api.jsh.shell.rhino) $$api.slime.settings.set("jsh.engine.rhino.classpath", $$api.jsh.shell.rhino);

				$$api.slime.settings.sendPropertiesTo(command);

				//	TODO	If the container is classloader, presumably could use URLs or push the files switch back into $$api.java.Command
				var classpath = $$api.jsh.shell.classpath()._urls;
				for (var i=0; i<classpath.length; i++) {
					command.classpath(classpath[i]);
				}

				command.main($$api.jsh.engine.main);

				for (var i=0; i<$$api.arguments.length; i++) {
					command.argument($$api.arguments[i]);
				}

				$$api.debug("Running command " + command + " ...");
				var status = command.run();
				$$api.debug("Command returned: status = " + status);
				if (typeof(status) != "undefined") {
					$$api.jsh.exit(status);
				}
			}
		} catch (e) {
			if ($$api.debug) {
				$$api.debug("Error:");
				$$api.debug(e);
				$$api.debug(e.fileName + ":" + e.lineNumber);
			}
			if (e.rhinoException) {
				e.rhinoException.printStackTrace();
			} else if (e.printStackTrace) {
				e.printStackTrace();
			} else if (e.stack) {
				Packages.java.lang.System.err.println("Stack trace: " + "\n" + e.stack);
			} else if (typeof(e) == "string") {
				Packages.java.lang.System.err.println("[jsh] Launch failed: " + e);
			} else if (e instanceof Error) {
				Packages.java.lang.System.err.println("[jsh] Launch failed: " + e.message);
			}
			//	Below works around Rhino debugger bug that does not allow e to be inspected
			var error = e;
			$$api.jsh.exit(1);
		}

	}
//@ts-ignore
).call(this);
