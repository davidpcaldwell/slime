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
//	with usr/bin/env on UNIX and was not done at all on Windows (except Cygwin; see below).
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

//	TODO	can this be run with Java 6/7 jrunscript?
//	TODO	convert jsh build script to a jsh script that runs in an unbuilt shell
//	TODO	create semi-automated verify process that includes non-automatable features (like debugger)
//	TODO	Prefer the client VM unless -server is specified (and do not redundantly specify -client)
//	TODO	At one point, was investigating using jjs as Nashorn launcher; is this still a good idea? If so, would using the
//			Rhino shell as main make sense for the Rhino case?
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
//	SHELL CLASSPATH
//
//	At one time, it was possible to configure the "shell classpath" -- to specify the Java classes used to help implement the shell.
//	However, there are no known use cases for this configurability, so the functionality was removed.

try {
	if (!this.$api.slime) {
		$api.script.resolve("slime.js").load();
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

	$api.jsh.engine = (function() {
		var engines = {
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

		this.files = function() {
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
			return this.files().join(colon);
		}
	};

	//	TODO	Merge below with above
	$api.jsh.Classpath = Classpath;

	$api.jsh.Unbuilt = function(src,rhino) {
		this.rhino = rhino;

		this.shellClasspath = function() {
			if (rhino && rhino.length) rhino = new Classpath(rhino);
			var LOADER_CLASSES = $api.io.tmpdir();
			var toCompile = $api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/java"));
			if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("loader/rhino/rhino")));
			toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("rhino/system/java")));
			toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/java")));
			if (rhino) toCompile = toCompile.concat($api.slime.src.getSourceFilesUnder(new $api.slime.src.File("jsh/loader/rhino")));
			var rhinoClasspath = (rhino) ? ["-classpath", rhino.local()] : [];
			$api.java.install.compile([
				"-d", LOADER_CLASSES
			].concat(rhinoClasspath).concat(toCompile));
			return [LOADER_CLASSES.toURI().toURL()];
		};
	};

	$api.jsh.Built = function(home) {
		this.home = home;

		if (new Packages.java.io.File(home, "lib/js.jar").exists()) {
			this.rhino = [new Packages.java.io.File(home, "lib/js.jar").toURI().toURL()];
		}

		this.shellClasspath = function() {
			return [new Packages.java.io.File(home, "lib/jsh.jar").toURI().toURL()];
		}
	};

	$api.jsh.Packaged = function(file) {
		this.packaged = file;

		this.shellClasspath = function() {
			return [file.toURI().toURL()];
		};
	};

	if (Packages.java.lang.System.getProperties().get("jsh.launcher.shell")) {
		$api.jsh.shell = new (function(peer) {
			var getRhinoClasspath = function() {
				var classpath = peer.getRhinoClasspath();
				if (classpath) {
					return new Classpath(classpath);
				} else {
					return null;
				}
			};

			var Unbuilt = function(src) {
				return new $api.jsh.Unbuilt(src,getRhinoClasspath());
			};

			var Built = function(home) {
				return new $api.jsh.Built(home);
			};

			var Packaged = function(file) {
				return new $api.jsh.Packaged(file);
			};

			var shell = (function(peer) {
				if (peer.getPackaged()) {
					$api.debug("Setting packaged shell: " + String(peer.getPackaged().getCanonicalPath()));
					return new Packaged(peer.getPackaged());
				} else if (peer.getHome()) {
					$api.debug("Setting built shell: " + String(peer.getHome().getCanonicalPath()));
					return new Built(peer.getHome());
				} else {
					return new Unbuilt(new Packages.java.io.File($api.slime.setting("jsh.shell.src")));
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
	}

	if (!$api.shell.environment.JSH_NEW_LAUNCHER || $api.jsh.shell && $api.jsh.shell.packaged) {
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

		$api.slime.settings.sendPropertiesTo(function(name,value) {
			command.systemProperty(name,value);
		});

		//	TODO	If the container is classloader, presumably could use URLs or push the files switch back into $api.java.Command
		var classpath = $api.jsh.shell.classpath().files();
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
	$api.debug("Error:");
	$api.debug(e);
	$api.debug(e.fileName + ":" + e.lineNumber);
	if (e.rhinoException) {
		e.rhinoException.printStackTrace();
	} else if (e.printStackTrace) {
		e.printStackTrace();
	} else if (typeof(e) == "string") {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e);
	} else if (e instanceof Error) {
		Packages.java.lang.System.err.println("[jsh] Launch failed: " + e.message);
	}
	//	Below works around Rhino debugger bug that does not allow e to be inspected
	var error = e;
	debugger;
	$api.jsh.exit(1);
}