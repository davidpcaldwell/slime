//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,JavaAdapter,$api,jsh) {
		//	Build script for jsh

		//	The script can be invoked in two ways. The first builds a shell to the given directory:
		//	build.jsh.js <build-destination>
		//
		//	The second builds an executable JAR capable of installing the shell:
		//	build.jsh.js -installer <installer-destination>

		//	TODO	Eliminate launcher JAR file; seems to be used only for packaging applications now
		//	TODO	build script should build all plugins

		//	Policy decision to support 8 and up
		var JAVA_VERSION = 8;

		jsh.shell.console("Current shell: " + JSON.stringify(jsh.shell.jsh.Installation.from.current()));
		jsh.shell.console("Building jsh with arguments [" + jsh.script.arguments.join(" ") + "]");

		var parameters = jsh.script.getopts({
			options: {
				verbose: false,
				engine: jsh.script.getopts.ARRAY(String),
				rhino: jsh.file.Pathname,
				norhino: false,
				executable: false,
				installer: jsh.file.Pathname
			},
			unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		});

		jsh.script.loader = jsh.script.Loader("../../../");

		/** @type { { $api: typeof jsh.internal.bootstrap } } */
		var jrunscript = {
			$api: jsh.internal.bootstrap
		}

		var toPathname = function(/** @type { slime.jrunscript.file.Location } */location) {
			return jsh.file.Pathname(location.pathname);
		}

		/** @type { { rhino: slime.jrunscript.file.Searchpath } } */
		var build = (function() {
			var bothError = function(name) {
				throw new Error("Specified both -" + name + " and -no" + name + "; specify one or the other.");
			}

			var rv = {};
			if (rv.test === false && typeof(rv.unit) == "undefined") rv.unit = false;
			if (parameters.options.rhino && parameters.options.norhino) {
				bothError("rhino");
			}
			if (parameters.options.rhino && parameters.options.rhino.file) rv.rhino = jsh.file.Searchpath([parameters.options.rhino]);
			if (parameters.options.norhino) rv.rhino = null;

			//	Include Rhino if we are running under it and it is not explicitly excluded
			if (typeof(rv.rhino) == "undefined" && jsh.shell.rhino && jsh.shell.rhino.classpath) {
				rv.rhino = jsh.shell.rhino.classpath;
			}

			var downloadRhino = function(to) {
				var rhino = $api.fp.now(
					jsh.internal.bootstrap.rhino.compatible(),
					jsh.internal.api.Library
				);
				return jsh.file.Searchpath(
					rhino.download(jsh.shell.jsh.lib.pathname.os.adapt()).map(toPathname)
				)
			};

			if (jsh.script.url) {
				if (typeof(rv.rhino) == "undefined") {
					rv.rhino = downloadRhino();
				}
			} else if (jsh.script.file) {
				if (typeof(rv.rhino) == "undefined") {
					if (jsh.internal.bootstrap.engine.nashorn.running()) {
						if (parameters.options.rhino) {
							rv.rhino = downloadRhino(parameters.options.rhino);
						} else {
							//	do nothing; use Nashorn only
						}
					} else {
						rv.rhino = downloadRhino();
					}
				}
			} else {
				throw new Error();
			}
			return rv;
		})();

		if (jsh.script.url) {
			//	TODO	implement
			jsh.shell.console("Building from remote shell not supported.");
			jsh.shell.exit(1);
			//	download source code and relaunch
			//	http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/jsh/etc/build.jsh.js
			var matcher = /^http(s)?\:\/\/bitbucket\.org\/api\/1.0\/repositories\/davidpcaldwell\/slime\/raw\/(.*)\/jsh\/etc\/build.jsh.js$/;
			var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
			if (matcher.exec(jsh.script.url.toString())) {
				// var match = matcher.exec(jsh.script.url.toString());
				// jrunscript.$api.bitbucket.get({
				// 	protocol: "http" + ((match[1]) ? match[1] : ""),
				// 	revision: match[2],
				// 	destination: tmp.pathname.java.adapt()
				// });
				// var args = Array.prototype.slice.call(parameters.arguments);
				// args.push( (build.unit) ? "-unit" : "-nounit" );
				// args.push( (build.test) ? "-test" : "-notest" );
				// if (!build.doc) args.push("-nodoc");
				// /** @type { { [x: string] : string } } */
				// var properties = {};
				// if (build.rhino) {
				// 	args.push("-rhino", build.rhino.toString());
				// 	properties["jsh.engine.rhino.classpath"] = String(build.rhino);
				// }
				// jsh.shell.jsh({
				// 	shell: tmp,
				// 	properties: properties,
				// 	script: tmp.getFile("jrunscript/jsh/etc/build.jsh.js"),
				// 	arguments: args,
				// 	evaluate: function(result) {
				// 		jsh.shell.exit(result.status);
				// 	}
				// });
			} else {
				//	TODO	more helpful error message
				jsh.shell.console("Executing from unknown URL: " + jsh.script.url + " ... cannot locate source distribution for version.");
				jsh.shell.exit(1);
			}
		}

		var SLIME = jsh.script.file.parent.parent.parent.parent;

		var launcher = {
			src: jrunscript.$api.slime.Src({
				file: SLIME.getRelativePath("jrunscript/jsh/launcher/slime.js").java.adapt(),
				resolve: function(path) {
					jsh.shell.console("Resolving: " + path + " ...");
					var _file = SLIME.getSubdirectory("jrunscript/jsh/launcher").getRelativePath(path).java.adapt();
					jsh.shell.console("Resolved to " + _file);
					if (_file.exists()) {
						return {
							toString: function() { return String(_file.getCanonicalPath()); },
							file: _file
						};
					} else {
						return null;
					}
				}
			}),
			buildLoader: function(rhino) {
				//	Converts jsh searchpath to launcher classpath
				/** @type { slime.jrunscript.native.java.net.URL[] } */
				var _rhino = (rhino) ? (function() {
					var _urls = rhino.pathnames.map(function(pathname) {
						return pathname.java.adapt().toURI().toURL();
					});
					return _urls;
				})() : [];
				var unbuilt = jrunscript.$api.jsh.Unbuilt({
					src: launcher.src,
					rhino: _rhino
				});
				return unbuilt.compileLoader({ source: JAVA_VERSION, target: JAVA_VERSION });
			}
		};

		var console = jrunscript.$api.console;
		var debug = jrunscript.$api.debug;

		if (parameters.options.verbose) debug.on = true;

		//	TODO	probably want something like this instead
		if (false) {
			(
				function() {
					console = jsh.shell.console;
					debug = Object.assign(function(s) {
						if (parameters.options.verbose) jsh.shell.console(s);
					}, { on: false });
				}
			)();
		}

		var destination = (function(parameters) {
			//	TODO	should normalize Cygwin paths if Cygwin support is added
			var rv;

			var Installer = function(to) {
				this.installer = jsh.file.Pathname(to);
				this.shell = jsh.shell.TMPDIR.createTemporary({ directory: true });
				this.arguments = void(0);
			};

			var Destination = function(to) {
				this.installer = void(0);
				//	TODO	what should happen if destination directory exists?
				this.shell = jsh.file.Pathname(to).createDirectory({
					exists: function(dir) {
						dir.remove();
						return true;
					}
				});
				this.arguments = void(0);
			};

			if (parameters.options.installer) {
				rv = new Installer(parameters.options.installer);
			} else if (parameters.arguments[0]) {
				rv = new Destination(parameters.arguments.shift());
			}

			if (!rv) {
				console("Usage:");
				console(jsh.script.file.pathname.basename + " <build-destination>");
				console("-or-");
				console(jsh.script.file.pathname.basename + " -installer <installer-jar-location>");
				jsh.shell.exit(1);
			} else {
				rv.arguments = parameters.arguments;
				return rv;
			}
		})(parameters);

		console("Creating directories ...");
		["lib","script","script/launcher","modules","src"].forEach(function(path) {
			destination.shell.getRelativePath(path).createDirectory();
		});

		jsh.shell.console("Copying launcher scripts from " + JSON.stringify(jsh.shell.jsh.Installation.from.current()));
		jsh.shell.jsh.tools.copyLauncherScripts(SLIME, destination);

		parameters.options.engine.forEach(function(engine) {
			if (engine == "rhino") {
				//	TODO	can worry about version(s) as part of #1961
				//	for now we will use the Rhino corresponding to the executing version of Java
				build.rhino = $api.fp.Thunk.now(
					jsh.internal.api.rhino.compatible,
					function(library) { return library.download(destination.shell.getRelativePath("lib").os.adapt() ); },
					$api.fp.Array.map( toPathname ),
					jsh.file.Searchpath
				);
			} else {
				jsh.shell.console("Unsupported engine specified via -engine: " + engine);
				jsh.shell.exit(1);
			}
		});

		//	old invocation: -rhino
		if (parameters.options.engine.indexOf("rhino") == -1 && build.rhino) {
			console("Copying Rhino libraries ...");
			//	TODO	this isn't probably compatible with the direction we are going for libraries, but is likely to work at
			//			present, but the -rhino option is going away anyway
			build.rhino.pathnames.forEach( function(pathname,index,array) {
				pathname.file.copy(destination.shell.getSubdirectory("lib").getRelativePath(pathname.basename));
			});
		} else {
			console("Rhino libraries not present; building for Nashorn only.");
		}

		if (SLIME.getFile("local/jsh/lib/nashorn.jar")) {
			jsh.internal.bootstrap.nashorn.dependencies.jarNames.concat(["nashorn.jar"]).forEach(function(library) {
				SLIME.getFile("local/jsh/lib/" + library).copy(destination.shell.getSubdirectory("lib"));
			});
		}

		(function buildLoader() {
			console("Building jsh application ...");
			//	TODO	Do we want to cross-compile against JAVA_VERSION boot classes?
			//	TODO	test coverage for Nashorn
			//	TODO	target/source ignored; -g possibly not present
			//	TODO	May want to emit compiler information when running from build script
			var tmpClasses = launcher.buildLoader(build.rhino);
			jsh.file.zip({
				//	TODO	still need jsh.file java.adapt()
				from: jsh.file.Pathname( String(tmpClasses.getCanonicalPath()) ).directory,
				to: destination.shell.getRelativePath("lib/jsh.jar")
			});
		//	jrunscript.$api.jsh.zip(tmpClasses,new File(JSH_HOME,"lib/jsh.jar"));
		})();

		console("Building launcher ...");
		(function buildLauncher() {
			console("Compiling ...");
			var _tmp = jrunscript.$api.slime.launcher.compile({ src: launcher.src });
			console("Compiled.");
			var tmp = jsh.file.Pathname(String(_tmp.getCanonicalPath())).directory;
			//	TODO	assume manifest uses \n always, does it?
			tmp.getRelativePath("META-INF/MANIFEST.MF").write([
				"Main-Class: inonit.script.jsh.launcher.Main",
				""
			].join("\n"), { append: false, recursive: true });
			jsh.file.zip({
				from: tmp,
				to: destination.shell.getRelativePath("jsh.jar")
			})
		})();

		(function copyScripts() {
			console("Copying bootstrap scripts ...");
			SLIME.getSubdirectory("loader").copy(destination.shell.getRelativePath("script/loader"));
			SLIME.getSubdirectory("jrunscript/jsh/loader").copy(destination.shell.getRelativePath("script/jsh"));
		})();

		(function createModules() {
			console("Creating bundled modules ...")
			//	TODO	remove or modify this; appears to redefine the slime global object
			var slime = jsh.script.loader.file("jrunscript/jsh/tools/slime.js").slime;
			var MODULE_CLASSPATH = (function() {
				var files = [];
				if (build.rhino) {
					files.push.apply(files,build.rhino.pathnames);
				}
				files.push(destination.shell.getRelativePath("lib/jsh.jar"));
				return jsh.file.Searchpath(files);
			})();
			var module = function(path,compile) {
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
				slime.build.jsh(
					SLIME.getSubdirectory(path),
					tmp,
					(compile) ? { source: JAVA_VERSION, target: JAVA_VERSION, classpath: MODULE_CLASSPATH.toString(), nowarn: true, rhino: build.rhino } : null
				);
				var topath = path.replace(/\//g, ".");
				if (topath.substring(topath.length-1) == ".") topath = topath.substring(0,topath.length-1);
				var to = destination.shell.getRelativePath("modules/" + path.replace(/\//g, ".") + "slime");
				jsh.file.zip({
					from: tmp,
					to: to
				});
				console("Created module file: " + to);
			};

			//	TODO	clean up below here
			var modules = eval(SLIME.getFile("jrunscript/jsh/etc/api.js").read(String)).environment("jsh");

			modules.forEach(function(item) {
				if (item.module) {
					module(item.path, item.module.javac);
				}
			});

			return modules;
		})();

		jsh.shell.console("Creating plugins directory ...");
		destination.shell.getRelativePath("plugins").createDirectory();

		console("Creating tools ...");
		SLIME.getSubdirectory("jrunscript/jsh/tools").copy(destination.shell.getRelativePath("tools"));

		console("Creating install scripts ...");
		var ETC = destination.shell.getRelativePath("etc").createDirectory();
		SLIME.getFile("jrunscript/jsh/etc/install.jsh.js").copy(ETC);

		(function copySource() {
			console("Bundling source code ...");
			SLIME.list({
				filter: function(node) {
					return !node.directory;
				},
				descendants: function(directory) {
					//	TODO	could we use .gitignore for this?
					if (directory.pathname.basename == ".git") return false;
					if (directory.pathname.basename == "bin") return false;
					if (directory.pathname.basename == ".gradle") return false;
					if (directory.pathname.basename == ".settings") return false;
					if (directory.pathname.basename == "local") return false;
					return true;
				},
				type: SLIME.list.ENTRY
			}).forEach(function(entry) {
				//	TODO	need for 'recursive' was not clear from documentation
				entry.node.copy(destination.shell.getRelativePath("src/" + entry.path), { recursive: true });
			});
		})();

		if (!destination.installer) {
			//	Decision as of now is not to build these platform-specific components if building an installer

			(function postInstaller() {
				console("Running post-installer with arguments [" + destination.arguments.join(" ") + "] ... ");
				/** @type { { [x: string]: string } } */
				var properties = {};
				if (Packages.java.lang.System.getProperty("jsh.build.downloads")) {
					properties["jsh.build.downloads"] = String(Packages.java.lang.System.getProperty("jsh.build.downloads"));
				}
				jsh.shell.jsh({
					shell: destination.shell,
					properties: properties,
					script: destination.shell.getFile("etc/install.jsh.js"),
					arguments: destination.arguments
				});
				console("Ran post-installer.");
			})();

			//	Build native launcher
			//	TODO	re-enable native launcher for new jrunscript launcher
			if (parameters.options.executable) {
				var which = function(command) {
					return jsh.shell.PATH.getCommand(command);
				};

				var CYGWIN = false;
				var UNIX = false;

				var uname = which("uname");
				if (uname) {
					jsh.shell.console("Detected UNIX-like operating system.");
					UNIX = true;
					//	Re-use the detection logic that jsh uses for Cygwin, although this leaves it opaque in this script exactly how we are doing
					//	it; we could run the uname we just found, or even check for its .exe extension
					if (jsh.file.filesystems.cygwin) {
						jsh.shell.console("Detected Cygwin.");
						CYGWIN = true;
					}
				} else {
					parameters.options.unix = false;
					parameters.options.cygwin = false;
					jsh.shell.console("Did not detect UNIX-like operating system using PATH: " + jsh.shell.PATH);
				}

				if (CYGWIN) {
					//	TODO	use LoadLibrary call to locate jvm.dll
					//			embed path of jvm.dll in C program, possibly, or load from registry, or ...
					var bash = which("bash");
					if (bash) {
						throw new Error("Below failed type-checking because the install variable is not defined.")
						// var env = jsh.js.Object.set({}, jsh.shell.environment, {
						// 	//	We assume we are running in a JDK, so the java.home is [jdk]/jre, so we look at parent
						// 	//	TODO	improve this check
						// 	JAVA_HOME: jsh.shell.java.home.parent.pathname.toString(),
						// 	LIB_TMP: jsh.shell.TMPDIR.pathname.toString(),
						// 	TO: install.pathname.toString()
						// });
						// jsh.shell.console("Building Cygwin native launcher with environment " + jsh.js.toLiteral(env));
						// jsh.shell.shell(
						// 	bash,
						// 	[
						// 		src.getRelativePath("jrunscript/jsh/launcher/native/win32/cygwin.bash")
						// 	],
						// 	{
						// 		environment: env
						// 	}
						// );
					} else {
						jsh.shell.console("bash not found on Cygwin; not building native launcher.");
					}
				} else if (UNIX) {
					(
						function() {
							var gcc = which("gcc");
							if (!gcc) {
								jsh.shell.console("Cannot find gcc in PATH when attempting to build native launcher; exiting.");
								jsh.shell.exit(1);
								// return;
							}
							var args = ["-o", "jsh"];
							args.push(SLIME.getRelativePath("jrunscript/jsh/launcher/native/jsh.c").toString());
							jsh.shell.console("Invoking gcc " + args.join(" ") + " ...");
							jsh.shell.shell(
								gcc.pathname.toString(),
								args,
								{
									workingDirectory: destination.shell,
									onExit: function(result) {
										if (result.status == 0) {
											jsh.shell.console("Built native launcher to " + destination.shell.getRelativePath("jsh"));
										} else {
											throw new Error("Failed to build native launcher.");
										}
									}
								}
							);
						}
					)();
				} else {
					jsh.shell.console("Did not detect UNIX-like operating system (detected " + jsh.shell.os.name + "); not building native launcher.");
					jsh.shell.exit(1);
				}
			} else {
				jsh.shell.console("No -executable argument; skipping native launcher");
			}

			//	TODO	run test cases given in jsh.c
		}

		if (destination.installer) {
			(
				function() {
					//	TODO	allow getting named resource as stream from within jsh
					//	TODO	allow jsh.file.unzip to take a stream as its source
					console("Build installer to " + destination.installer);
					var zipdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var zip = zipdir.getRelativePath("build.zip");
					console("Build build.zip to " + zip);
					jsh.file.zip({
						from: destination.shell,
						to: zip
					});
					jsh.shell.jsh({
						shell: destination.shell,
						script: destination.shell.getFile("tools/package.jsh.js"),
						arguments: [
							"-script", destination.shell.getRelativePath("etc/install.jsh.js"),
							"-file", "build.zip=" + zip,
							"-to", destination.installer
						].concat( (build.rhino) ? [] : ["-norhino"] )
					});
				}
			)();
		}
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,jsh);
