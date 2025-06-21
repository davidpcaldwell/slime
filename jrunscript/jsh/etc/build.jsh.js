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
		var JAVA_VERSION = "1.8";

		jsh.shell.console("Building jsh with arguments [" + jsh.script.arguments.join(" ") + "]");
		var parameters = jsh.script.getopts({
			options: {
				verbose: false,
				nounit: false,
				notest: false,
				unit: false,
				test: false,
				nodoc: false,
				rhino: jsh.file.Pathname,
				norhino: false,
				executable: false,
				installer: jsh.file.Pathname
			},
			unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		});

		jsh.script.loader = jsh.script.Loader("../../../");

		var jrunscript = (function() {
			/**
			 * @type { slime.internal.jrunscript.bootstrap.Global & { launcher: any } }
			 */
			var THIS = {
				Packages: Packages,
				JavaAdapter: JavaAdapter,
				load: function(url) {
					jsh.shell.console("build.jsh.js loading " + url);
					if (jsh.file.Pathname(url).file) {
						jsh.loader.run(jsh.file.Pathname(url), {}, THIS);
					}
				},
				readUrl: void(0),
				$api: void(0),
				launcher: void(0),
				Java: void(0)
			};
			THIS.$api = {
				toString: function() { return "it"; },
				script: (jsh.script.url) ? { url: jsh.script.url } : { file: jsh.script.file.toString() },
				arguments: [],
				debug: false,
				engine: {
					script: (jsh.script.file) ? jsh.script.file.parent.parent.getRelativePath("rhino/jrunscript/api.js").toString() : null
				},
				load: function(url) {
					jsh.shell.console("Loading " + url);
					if (jsh.file.Pathname(url).file) {
						jsh.loader.run(jsh.file.Pathname(url), {}, THIS);
					}
				}
			};
			jsh.script.loader.run("rhino/jrunscript/api.js", {}, THIS);
			THIS.$api.arguments = [];
			return THIS;
		})();

		var build = (function() {
			var bothError = function(name) {
				throw new Error("Specified both -" + name + " and -no" + name + "; specify one or the other.");
			}

			var setBoolean = function(rv,name) {
				if (parameters.options[name] && parameters.options["no" + name]) {
					bothError(name);
				}
				if (parameters.options[name]) rv[name] = true;
				if (parameters.options["no" + name]) rv[name] = false;
			};

			var otherwise = function(o,property,value) {
				if (typeof(o[property]) == "undefined") {
					o[property] = value;
				}
			};

			var rv = {};
			setBoolean(rv,"test");
			setBoolean(rv,"unit");
			if (rv.test === false && typeof(rv.unit) == "undefined") rv.unit = false;
			setBoolean(rv,"doc");
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
				jsh.shell.tools.rhino.require.simple();
				return jsh.file.Searchpath([jsh.shell.jsh.lib.getRelativePath("js.jar")]);
			};

			if (jsh.script.url) {
				otherwise(rv,"unit",false);
				otherwise(rv,"test",false);
				otherwise(rv,"doc",true);
				if (typeof(rv.rhino) == "undefined") {
					rv.rhino = downloadRhino();
				}
			} else if (jsh.script.file) {
				otherwise(rv,"unit",true);
				otherwise(rv,"test",true);
				//	Should the default for doc be false?
				otherwise(rv,"doc",true);
				if (typeof(rv.rhino) == "undefined") {
					if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
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

		var loadLauncherScript = function(name) {
			var argument = (function() {
				if (jsh.script.file) return { file: jsh.script.file.parent.getRelativePath("../../jsh/launcher/" + name).java.adapt() };
				if (jsh.script.url) {
					var _url = new Packages.java.net.URL(jsh.script.url.toString());
					var _resolved = new Packages.java.net.URL(_url, "../../jsh/launcher/" + name);
					return { url: _resolved };
				}
			})();
			jrunscript.$api.script = new jrunscript.$api.Script(argument);
			jsh.script.loader.run("jrunscript/jsh/launcher/" + name, { $api: jrunscript.$api }, jrunscript);
		}

		loadLauncherScript("slime.js");
		loadLauncherScript("launcher.js");

		jrunscript.launcher = {};
		jrunscript.launcher.buildLoader = function(rhino) {
			//	Converts jsh searchpath to launcher classpath
			var _rhino = (rhino) ? (function() {
				var _urls = rhino.pathnames.map(function(pathname) {
					return pathname.java.adapt().toURI().toURL();
				});
				return _urls;
			})() : null;
			var unbuilt = new jrunscript.$api.jsh.Unbuilt({ rhino: _rhino });
			return unbuilt.compileLoader({ source: JAVA_VERSION, target: JAVA_VERSION });
		}

		var console = jrunscript.$api.console;
		var debug = jrunscript.$api.debug;

		if (parameters.options.verbose) debug.on = true;

		//	TODO	probably want something like this instead
		if (false) {
			(
				function() {
					console = jsh.shell.console;
					debug = function(s) {
						if (parameters.options.verbose) jsh.shell.console(s);
					};
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

		var SLIME = jsh.script.file.parent.parent.parent.parent;

		console("Creating directories ...");
		["lib","script","script/launcher","modules","src"].forEach(function(path) {
			destination.shell.getRelativePath(path).createDirectory();
		});

		console("Copying launcher scripts ...");
		SLIME.getFile("rhino/jrunscript/api.js").copy(destination.shell.getRelativePath("jsh.js"));
		["slime.js","javac.js","launcher.js","main.js"].forEach(function(name) {
			SLIME.getFile("jrunscript/jsh/launcher/" + name).copy(destination.shell);
		});

		if (build.rhino) {
			console("Copying Rhino libraries ...");
			//	TODO	if multiple Rhino libraries and none named js.jar, built shell will not use Rhino
			build.rhino.pathnames.forEach( function(pathname,index,array) {
				var name = (array.length == 1) ? "js.jar" : pathname.basename;
				pathname.file.copy(destination.shell.getSubdirectory("lib").getRelativePath(name));
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
			var tmpClasses = jrunscript.launcher.buildLoader(build.rhino);
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
			var _tmp = jrunscript.$api.slime.launcher.compile();
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

			// TODO: probably should just move this functionality into this file
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

		var getTestEnvironment = $api.fp.impure.Input.memoized(function() {
			var subenv = {};
			for (var x in jsh.shell.environment) {
				if (!/^JSH_/.test(x)) {
					subenv[x] = jsh.shell.environment[x];
				}
			}
			//	TODO	test whether Tomcat tests work in shells where -install tomcat is indicated
			//	TODO	ensure that user plugins are disabled; the below probably does not work. See inonit.jsh.script.Main, which
			//			automatically uses user plugins
			if (typeof(subenv.JSH_PLUGINS) != "undefined") delete subenv.JSH_PLUGINS;
			return subenv;
		});

		(function() {
			// TODO: unit and integration tests used to be separate, and could again be; right now integration tests are embedded in unit
			// tests
			if (build.unit || build.test) {
				console("Running unit tests ...");
				jsh.shell.jsh({
					shell: destination.shell,
					script: destination.shell.getFile("src/jsh/test/unit.jsh.js"),
					environment: getTestEnvironment()
				});
			}
			if (build.doc) {
				var args = [];
				console("Running jsapi.jsh.js to generate documentation ...");
				args.push("-notest");
				args.push("-doc",destination.shell.getRelativePath("doc/api"));
				args.push("-index",SLIME.getFile("jrunscript/jsh/etc/api.html"));
				jsh.shell.jsh({
					shell: destination.shell,
					script: SLIME.getFile("loader/api/old/jsh/jsapi.jsh.js"),
					arguments: args,
					environment: getTestEnvironment()
				});
			}
		})();

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
