//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	rename this file to jsh.launcher.js

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

try {
	var $api = this.$api;
	if (!this.$api.slime) {
		//	This can occur when the script is called from a packaged script
		//	TODO	figure out how and why, and whether the packaged script should invoke slime.js itself instead
		var slime = $api.script.resolve("slime.js");
		slime.load();
		$api.log("Loaded slime.js: src=" + $api.slime.src);
	}

	if ($api.slime.setting("jsh.launcher.debug")) {
		$api.debug.on = true;
		$api.debug("debugging enabled");
	}

	$api.jsh = {};

	$api.jsh.exit = $api.engine.resolve({
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
		}
	});

	$api.jsh.engines = {
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
		}
	};

	$api.jsh.engine = (function() {
		var engines = $api.jsh.engines;
		if ($api.slime.settings.get("jsh.engine")) {
			return (function(setting) {
				return engines[setting];
			})($api.slime.settings.get("jsh.engine"));
		}
		return $api.engine.resolve(engines);
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
		//			var tmpdir = new Directory(String($api.io.tmpdir().getCanonicalPath()));
		//
		//			var rhino = ClassLoader.getSystemResourceAsStream("$jsh/rhino.jar");
		//			if (rhino) {
		//				$api.debug("Copying rhino ...");
		//				var rhinoCopiedTo = tmpdir.getFile("rhino.jar");
		//				var writeTo = rhinoCopiedTo.writeTo();
		//				$api.io.copy(rhino,writeTo);
		//			}
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
	$api.jsh.Classpath = Classpath;

	$api.script.resolve("javac.js").load();

	$api.jsh.Unbuilt = function(p) {
		//	TODO	p.rhino argument is supplied by jsh/etc/build.jsh.js and is dubious
		this.toString = function() {
			return "Unbuilt: src=" + $api.slime.src + " rhino=" + this.rhino;
		}

		var lib = (function() {
			var setting = $api.slime.settings.get("jsh.shell.lib");
			if (/^http/.test(setting)) {
				return { url: setting }
			} else {
				var file = new Packages.java.io.File($api.slime.settings.get("jsh.shell.lib"));
				if (!file.exists()) file.mkdirs();
				return { file: file };
			}
		})();

		var rhino = (p && p.rhino) ? p.rhino : null;

		if (!rhino) {
			if ($api.slime.settings.get("jsh.engine.rhino.classpath")) {
				rhino = [new Packages.java.io.File($api.slime.settings.get("jsh.engine.rhino.classpath")).toURI().toURL()];
			} else if ($api.slime.settings.get("jsh.shell.lib") && lib.file) {
				if (new Packages.java.io.File(lib.file, "js.jar").exists()) {
					rhino = [new Packages.java.io.File(lib.file, "js.jar").toURI().toURL()];
				}
			}
		}

		this.rhino = rhino;

		var rhinoClasspath = (rhino && rhino.length) ? new Classpath(rhino) : null;

		this.profiler = (function() {
			if ($api.slime.settings.get("jsh.shell.profiler")) {
				return new Packages.java.io.File($api.slime.settings.get("jsh.shell.profiler"));
			}
		})();

		var getLoaderSourceFiles = function(p) {
			var directories = [];
			directories.push("loader/rhino/java/");
			if (p.rhino) directories.push("loader/rhino/rhino/");
			directories.push("rhino/system/java/");
			directories.push("jsh/loader/java/");
			if (p.rhino) directories.push("jsh/loader/rhino/");
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

		//	As of this writing, used by jsh/etc/build.jsh.js, as well as shellClasspath method below
		this.compileLoader = function(p) {
			var rhino = (this.rhino && this.rhino.length) ? new Classpath(this.rhino) : null;
			if (!p) p = {};
			if (!p.to) p.to = $api.io.tmpdir();
			var toCompile = $api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/java"));
			if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/rhino")));
			toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("rhino/system/java")));
			toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/java")));
			if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/rhino")));
			var rhinoJavacArguments = (rhino) ? ["-classpath", rhino.local()] : [];
			var targetArguments = (p && p.target) ? ["-target", p.target] : [];
			var sourceArguments = (p && p.source) ? ["-source", p.source] : [];
			var args = [
				"-Xlint:unchecked",
				"-d", p.to
			].concat(rhinoJavacArguments).concat(sourceArguments).concat(targetArguments);
			//	TODO	we used to use .concat(toCompile) but that does not work under Nashorn 8u45, which is presumably a Nashorn
			//			bug
			for (var i=0; i<toCompile.length; i++) {
				args.push(toCompile[i].getCanonicalPath());
			}
			$api.java.install.compile(args);
			return p.to;
		};

		this.shellClasspath = function() {
			if (!$api.slime.src) throw new Error("Could not detect SLIME source root for unbuilt shell.")
			var setting = $api.slime.settings.get("jsh.shell.classes");
			var LOADER_CLASSES = (setting) ? new Packages.java.io.File(setting, "loader") : $api.io.tmpdir();
			if (!LOADER_CLASSES.exists()) LOADER_CLASSES.mkdirs();
			if ($api.slime.src.File) {
				if (setting && LOADER_CLASSES.exists() && new Packages.java.io.File(LOADER_CLASSES, "inonit/script/engine/Code.class").exists()) {
					$api.debug("Found already-compiled files.");
				} else {
					this.compileLoader({
						to: LOADER_CLASSES
					});
				}
			} else {
				$api.log("Looking for loader source files under " + $api.slime.src + " ...");
				var toCompile = getLoaderSourceFiles({
					list: function(string) {
						return $api.slime.src.getSourceFilesUnder(string);
					},
					rhino: rhinoClasspath,
					on: {
						start: function(e) {
							$api.log("Checking under " + e.path + " (" + e.current + "/" + e.total + ")");
						},
						end: function(e) {
							$api.log("Done checking under " + e.path + " (" + e.current + "/" + e.total + ")");
						}
					}
				});
				$api.java.compile({
					classpath: (rhinoClasspath) ? rhinoClasspath._urls : [],
					destination: LOADER_CLASSES,
					files: toCompile
				});
			}
			$api.debug("Returning shellClasspath: " + LOADER_CLASSES.toURI().toURL());
			return [LOADER_CLASSES.toURI().toURL()];
		};
	};

	$api.jsh.Built = function(home) {
		this.toString = function() {
			var rhino = (new Packages.java.io.File(home, "lib/js.jar").exists()) ? new Packages.java.io.File(home, "lib/js.jar") : void(0);
			return "Built: " + home + " rhino=" + rhino;
		}

		this.home = home;

		if (new Packages.java.io.File(home, "lib/js.jar").exists()) {
			this.rhino = [new Packages.java.io.File(home, "lib/js.jar").toURI().toURL()];
		}

		if (new Packages.java.io.File(home, "tools/profiler.jar").exists()) {
			this.profiler = new Packages.java.io.File(home, "tools/profiler.jar");
		}

		this.shellClasspath = function() {
			return [new Packages.java.io.File(home, "lib/jsh.jar").toURI().toURL()];
		}
	};

	$api.jsh.Packaged = function(file) {
		this.packaged = file;

		//	TODO	test and enable (and document) if this works
		if (false) this.profiler = (function() {
			if ($api.slime.settings.get("jsh.shell.profiler")) {
				return new Packages.java.io.File($api.slime.settings.get("jsh.shell.profiler"));
			}
		})();

		this.shellClasspath = function() {
			return [file.toURI().toURL()];
		};
	};

	//	TODO	it seems like the below should migrate to main.js where similar code is already present, and packaged applications
	//			should launch that script
	if (Packages.java.lang.System.getProperties().get("jsh.launcher.shell") && Packages.java.lang.System.getProperties().get("jsh.launcher.shell").getPackaged()) {
		$api.jsh.shell = new (function(peer) {
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
					$api.debug("Setting packaged shell: " + String(peer.getPackaged().getCanonicalPath()));
					return new $api.jsh.Packaged(peer.getPackaged());
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

				$api.jsh.engine.resolve({
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

		if ($api.arguments.length == 0 && !$api.jsh.shell.packaged) {
			$api.console("Usage: " + $api.script.file + " <script-path> [arguments]");
			//	TODO	should replace the below with a mechanism that uses setExitStatus, adding setExitStatus for Rhino throwing a
			//			java.lang.Error so that it is not caught
			$api.jsh.exit(1);
		}

		$api.debug("Launcher environment = " + JSON.stringify($api.shell.environment, void(0), "    "));
		$api.debug("Launcher working directory = " + Packages.java.lang.System.getProperty("user.dir"));
		$api.debug("Launcher system properties = " + Packages.java.lang.System.getProperties());

		$api.debug("Creating command ...");
		var command = new $api.java.Command();

		var container = (function() {
			//	TODO	test whether next line necessary
			if ($api.jsh.shell.packaged) return "jvm";
			if ($api.slime.settings.get("jsh.shell.container")) return $api.slime.settings.get("jsh.shell.container");
			return "classloader";
		})();
		if (container == "jvm") {
			command.fork();
		}

		(function vmArguments() {
			//	TODO	what about jsh.jvm.options? If it is set, the options may already have been applied by launcher and we may not need
			//			to add them and fork a VM; launcher could *unset* them, perhaps. Need to think through and develop test case
			if ($api.jsh.shell.packaged) return;
			var rv = [];
			while($api.arguments.length && $api.arguments[0].substring(0,1) == "-") {
				command.vm($api.arguments.shift());
			}
			return rv;
		})();

		//	Make the launcher classpath available to help with launching subshells
		$api.slime.settings.set("jsh.launcher.classpath", String(Packages.java.lang.System.getProperty("java.class.path")));

		//	Describe the shell
		if ($api.jsh.shell.rhino) $api.slime.settings.set("jsh.engine.rhino.classpath", $api.jsh.shell.rhino);

		$api.slime.settings.sendPropertiesTo(command);

		//	TODO	If the container is classloader, presumably could use URLs or push the files switch back into $api.java.Command
		var classpath = $api.jsh.shell.classpath()._urls;
		for (var i=0; i<classpath.length; i++) {
			command.classpath(classpath[i]);
		}

		command.main($api.jsh.engine.main);

		for (var i=0; i<$api.arguments.length; i++) {
			command.argument($api.arguments[i]);
		}

		$api.debug("Running command " + command + " ...");
		var status = command.run();
		$api.debug("Command returned: status = " + status);
		$api.jsh.exit(status);
	}
} catch (e) {
	if ($api.debug) {
		$api.debug("Error:");
		$api.debug(e);
		$api.debug(e.fileName + ":" + e.lineNumber);
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
	$api.jsh.exit(1);
}