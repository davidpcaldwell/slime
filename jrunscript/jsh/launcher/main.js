//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	Script to launch a script in an unbuilt jsh. Should be invoked via the jsh/etc/unbuilt.rhino.js tool; see that tool for
//	details

//@ts-check
(
	/**
	 *
	 * @this { slime.jsh.internal.launcher.Global }
	 */
	function() {
		var Java = this.Java;
		var Packages = this.Packages;
		var $api = this.$api;

		if ($api.embed) {
			$api.script = $api.embed.jsh;
		}

		if (!$api.slime) {
			if ($api.script.url) {
				//	Load as-is, I guess?
			} else if (String($api.script.file.getParentFile().getName()) == "launcher") {
				//	Graal does not currently implement java.lang.String methods on strings
				//	Load as-is
			} else if ($api.script.file.getParentFile().getName().equals("launcher")) {
				//	Load as-is
			} else {
				//	TODO	hard-codes assumption of built shell and hard-codes assumption unbuilt shell will arrive via launcher script; should
				//			tighten this implementation
				/** @type { slime.jsh.internal.launcher.SlimeConfiguration } */
				var slimeConfiguration = {
					built: $api.script.file.getParentFile()
				};
				var setProperty = function(obj,name,value) {
					obj[name] = value;
				}
				setProperty($api, "slime", slimeConfiguration);
			}
			$api.script.resolve("slime.js").load();
		}

		$api.debug.on = Boolean($api.slime.settings.get("jsh.launcher.debug"));
		$api.debug("Source: " + $api.slime.src);
		$api.debug("Bootstrap script: " + $api.script);

		(
			function() {
				var argv = this["javax.script.argv"];
				$api.debug("javax.script.argv = " + JSON.stringify(argv));
				$api.debug("$api.arguments = " + JSON.stringify($api.arguments));
			}
		)();

		//var container = new function() {
		//	//	TODO	jsh.tmpdir is not correctly passed to launcher in the forking scenario
		//
		//	var id = ($api.slime.settings.get("jsh.shell.container")) ? $api.slime.settings.get("jsh.shell.container") : "classloader";
		//
		//	var vm = [];
		//
		//	this.argument = function(string) {
		//		vm.push(string);
		//	}
		//
		//	if (id == "classloader") {
		//		this.getVmArguments = function() {
		//			return vm.concat($api.slime.settings.getContainerArguments());
		//		};
		//
		//		this.getLauncherArguments = function() {
		//			return [];
		//		}
		//	} else {
		//		this.getVmArguments = function() {
		//			return vm.concat($api.slime.settings.getPropertyArguments());
		//		};
		//
		//		this.getLauncherArguments = function() {
		//			return vm;
		//		}
		//	}
		//}

		//	Add implementation of runCommand that echoes what it's doing to debug log
		$api.engine.runCommand = (function(was) {
			return function() {
				$api.debug("main.js Running: " + Array.prototype.slice.call(arguments).join(" "));
				return was.apply(this,arguments);
			}
		})($api.engine.runCommand);

		//	Supply arguments whose default values are provided by the jrunscript API

		//	If Rhino location not specified, and we are running this script inside Rhino, set that to be the default Rhino location for the
		//	shell
		$api.slime.settings["default"]("jsh.engine.rhino.classpath", $api.rhino.classpath);

		//	If SLIME source location not specified, and we can determine it, supply it to the shell
		$api.slime.settings["default"]("jsh.shell.src", ($api.slime.src) ? String($api.slime.src) : null);

		$api.script.resolve("launcher.js").load();

		//	If we have a sibling named jsh.jar, we are a built shell
		var shell = (function() {
			if ($api.script.resolve("jsh.jar")) {
				return $api.jsh.Built($api.script.file.getParentFile());
			} else {
				$api.slime.settings["default"](
					"jsh.shell.lib",
					$api.slime.src.getPath("local/jsh/lib")
				);

				$api.debug("jsh.shell.lib = " + $api.slime.settings.get("jsh.shell.lib"));

				// TODO: this same approach for locating the lib directory should be used in $$api.jsh.Built, no?
				var lib = (function() {
					var setting = $api.slime.settings.get("jsh.shell.lib");
					//	TODO	setting can be null because $$api.script.resolve() doesn't find local/jsh/lib online; should refactor
					if (!setting) return null;
					if (/^http/.test(setting)) {
						return { url: setting }
					} else {
						var file = new Packages.java.io.File($api.slime.settings.get("jsh.shell.lib"));
						if (!file.exists()) file.mkdirs();
						return { file: file };
					}
				})();

				var rhino = (function() {
					if ($api.slime.settings.get("jsh.engine.rhino.classpath")) {
						return [new Packages.java.io.File($api.slime.settings.get("jsh.engine.rhino.classpath")).toURI().toURL()];
					} else if ($api.slime.settings.get("jsh.shell.lib") && lib.file) {
						if (new Packages.java.io.File(lib.file, "js.jar").exists()) {
							return [new Packages.java.io.File(lib.file, "js.jar").toURI().toURL()];
						}
					}
				})();

				var nashorn = (function() {
					if ($api.slime.settings.get("jsh.shell.lib") && lib.file) {
						if (new Packages.java.io.File(lib.file, "nashorn.jar").exists()) {
							$api.debug("nashorn.jar found");
							return $api.nashorn.dependencies.jarNames.concat(["nashorn.jar"]).map(function(filename) {
								return new Packages.java.io.File(lib.file, filename).toURI().toURL();
							});
						}
					}
				})();

				return $api.jsh.Unbuilt({ lib: lib, rhino: rhino, nashorn: nashorn });
			}
		})();
		$api.debug("shell detected = " + shell);

		if (!new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
			$api.debug("Nashorn not detected via javax.script; removing.");
			delete $api.jsh.engines.nashorn;
		}
		if ($api.jsh.engines.nashorn) {
			var Context = Packages.jdk.nashorn.internal.runtime.Context;
			if (typeof(Context) != "function") {
				Context = Packages.org.openjdk.nashorn.internal.runtime.Context;
			}
			var $getContext;
			try {
				//	TODO	When executed under Rhino, this .class syntax is not available; believe there is an $api method to deal
				// 			with this already
				$getContext = Context.class.getMethod("getContext");
			} catch (e) {
				//	do nothing; $getContext will remain undefined
			}
			if (typeof(Context.getContext) != "function" && !$getContext) {
				$api.debug("jdk.nashorn.internal.runtime.Context.getContext not accessible; removing Nashorn.")
				delete $api.jsh.engines.nashorn;
			}
		}

		// TODO: delete Graal if it is not available

		var defaultEngine = (function() {
			if (shell.rhino) return "rhino";
			if ($api.jsh.engines.nashorn) return "nashorn";
			throw new Error("Neither Rhino nor Nashorn available; was this invoked in a way other than using the top-level jsh script?");
		})();
		$api.debug("shell after engine selection = " + shell);
		if (!defaultEngine) {
			Packages.java.lang.System.err.println("No compatible JavaScript engine found.");
			Packages.java.lang.System.exit(1);
		}
		$api.slime.settings["default"]("jsh.engine", defaultEngine);

		if ($api.slime.settings.get("jsh.engine") == "graal") {
			$api.debug("Engine is Graal.js");
			var lib = $api.slime.settings.get("jsh.shell.lib");
			if (new Packages.java.io.File(lib, "graal").exists()) {
				//	TODO	this logic is duplicated in launcher.js
				if (new Packages.java.io.File(lib, "graal/Contents/Home").exists()) {
					$api.slime.settings.set("jsh.java.home", String(new Packages.java.io.File(lib, "graal/Contents/Home")));
				} else {
					$api.slime.settings.set("jsh.java.home", String(new Packages.java.io.File(lib, "graal")));
				}
			} else {
				Packages.java.lang.System.err.println("Graal.js specified as engine but not found.");
				Packages.java.lang.System.exit(1);
			}
		}

		var command = new $api.java.Command();

		if ($api.slime.settings.get("jsh.java.home")) {
			$api.debug("setting jsh.java.home = " + $api.slime.settings.get("jsh.java.home"));
			command.home($api.java.Install(new Packages.java.io.File($api.slime.settings.get("jsh.java.home"))));
		}

		if ($api.arguments[0] == "-engines") {
			var engines = [];
			if (shell.rhino) engines.push("rhino");
			if ($api.jsh.engines.nashorn) engines.push("nashorn");
			Packages.java.lang.System.out.print(JSON.stringify(engines));
			Packages.java.lang.System.exit(0);
		}

		//	Read arguments that begin with dash until we find an argument that does not; interpret these as VM switches
		while($api.arguments.length > 0 && $api.arguments[0] && $api.arguments[0].substring(0,1) == "-") {
			command.vm($api.arguments.shift());
		}

		var jshLauncherJavaMajorVersion = (
			function() {
				//	TODO	move logic to $api.java
				function javaMajorVersionString(javaVersionProperty) {
					if (/^1\./.test(javaVersionProperty)) return javaVersionProperty.substring(2,3);
					return javaVersionProperty.split(".")[0];
				}

				var javaMajorVersion = Number(javaMajorVersionString(String(Packages.java.lang.System.getProperty("java.version"))));

				return javaMajorVersion;
			}
		)();

		var jshLoaderJavaMajorVersion = (
			function() {
				if ($api.slime.settings.get("jsh.java.home")) {
					var majorVersion = $api.java.Install(
						new Packages.java.io.File(
							$api.slime.settings.get("jsh.java.home")
						)
					).getMajorVersion();
					$api.debug("jsh.java.home major version detected: [" + majorVersion + "]");
					return majorVersion;
				} else {
					function javaMajorVersionString(javaVersionProperty) {
						if (/^1\./.test(javaVersionProperty)) return javaVersionProperty.substring(2,3);
						return javaVersionProperty.split(".")[0];
					}

					var javaMajorVersion = Number(javaMajorVersionString(String(Packages.java.lang.System.getProperty("java.version"))));

					return javaMajorVersion;
				}
			}
		)();

		//var loaderMajorVersion = jshLoaderJavaMajorVersion;

		var jshLoaderJavaHasJavaPlatformModuleSystem = (function() {
			if ($api.slime.settings.get("jsh.java.home")) {
				return jshLoaderJavaMajorVersion > 8;
			} else {
				var javaLangObjectClass = Packages.java.lang.Class.forName("java.lang.Object");
				return typeof(javaLangObjectClass.getModule) == "function";
			}
		})();

		if (jshLoaderJavaHasJavaPlatformModuleSystem) {
			command.vm("--add-opens");
			command.vm("java.base/java.lang=ALL-UNNAMED");
			command.vm("--add-opens");
			command.vm("java.base/java.lang.reflect=ALL-UNNAMED");
			command.vm("--add-opens");
			command.vm("java.base/java.net=ALL-UNNAMED");
			command.vm("--add-opens");
			command.vm("java.base/sun.net.www.protocol.http=ALL-UNNAMED");
			command.vm("--add-opens");
			command.vm("java.base/sun.net.www.protocol.https=ALL-UNNAMED");
			command.vm("--add-opens");
			command.vm("jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED");

			if (jshLoaderJavaMajorVersion < 15) {
				command.vm("--add-opens");
				command.vm("jdk.scripting.nashorn/jdk.nashorn.internal.runtime=ALL-UNNAMED");
			}
		}

		(
			function handleNashornDeprecation() {
				if (jshLoaderJavaMajorVersion > 8 && jshLoaderJavaMajorVersion < 15) {
					command.systemProperty("nashorn.args", "--no-deprecation-warning");
				}
			}
		)();

		var _urls = [];

		if (shell.rhino) {
			//	TODO	possibly redundant with some code in launcher.js; examine and think through
			$api.slime.settings.set("jsh.engine.rhino.classpath", new $api.jsh.Classpath(shell.rhino).local());
			for (var i=0; i<shell.rhino.length; i++) {
				_urls.push(shell.rhino[i]);
			}
		}

		if (shell.nashorn && jshLoaderJavaMajorVersion >= 15) {
			//	TODO	possibly redundant with some code in launcher.js; examine and think through
			// $api.slime.settings.set("jsh.engine.rhino.classpath", new $api.jsh.Classpath(shell.rhino).local());
			for (var i=0; i<shell.nashorn.length; i++) {
				_urls.push(shell.nashorn[i]);
			}
		}

		if ($api.slime.settings.get("jsh.engine") == "graal") {
			if (jshLoaderJavaMajorVersion < 17) {
				Packages.java.lang.System.err.println("GraalVM cannot be launched by a launcher running a pre-17 Java VM.");
				Packages.java.lang.System.exit(1);
			}
			var lib = $api.slime.settings.get("jsh.shell.lib");
			var polyglotLib = new Packages.java.io.File(lib, "graal/lib/polyglot");
			$api.debug("polyglotLib = " + polyglotLib);
			var _polyglotLibraries = polyglotLib.listFiles();
			var polyglotLibs = [];
			for (var i=0; i<_polyglotLibraries.length; i++) {
				polyglotLibs.push(_polyglotLibraries[i]);
			}
			polyglotLibs.forEach(function(lib) {
				$api.debug("classpath = " + lib);
				_urls.push(lib.toURI().toURL());
			});
		}

		// TODO: currently there is no strategy for handling these options jsh.engine and jsh.debug.script if they conflict
		var scriptDebugger = $api.slime.settings.get("jsh.debug.script");
		var profilerMatcher =  /^profiler(?:\:(.*))?$/;
		if ( profilerMatcher.test(scriptDebugger)) {
			var profilerMatch = profilerMatcher.exec(scriptDebugger);
			if (shell.profiler) {
				if ($api.slime.settings.get("jsh.engine") == "rhino") {
					if (profilerMatch[1]) {
						command.vm("-javaagent:" + shell.profiler + "=" + profilerMatch[1]);
					} else {
						command.vm("-javaagent:" + shell.profiler);
					}
				} else {
					Packages.java.lang.System.err.println("Profiler does not run under Nashorn.");
					Packages.java.lang.System.exit(1);
				}
			} else {
				Packages.java.lang.System.err.println("Could not find profiler.");
				Packages.java.lang.System.exit(1);
			}
		} else if (scriptDebugger == "rhino") {
			if (!shell.rhino) {
				Packages.java.lang.System.err.println("Rhino engine not present, but Rhino debugger specified. Exiting.");
				Packages.java.lang.System.exit(1);
			}
			$api.slime.settings.set("jsh.engine", "rhino");
		} else if (scriptDebugger == "ncdbg") {
			$api.slime.settings.set("jsh.engine", "nashorn");
			var ncdbg = (function() {
				if ($api.slime.src) return $api.slime.src.File("jsh/tools/ncdbg.jsh.js");
				if ($api.slime.home) return new Packages.java.io.File($api.slime.home, "src/jsh/tools/ncdbg.jsh.js");
			})();
			// TODO: command.argument(.../ncdbg.jsh.js)
			command.argument(String(ncdbg.getAbsolutePath()));
		//	throw new Error("ncdbg jsh.debug.script not implemented");
		} else if (scriptDebugger == "graal") {
			$api.slime.settings.set("jsh.engine", "graal");
		//	command.vm("-Dpolyglot.inspect=true");
		//	command.argument("--inspect");
		} else if (scriptDebugger) {
			Packages.java.lang.System.err.println("Unknown script debugger (jsh.debug.script) specified: [" + scriptDebugger + "]. Exiting.");
			Packages.java.lang.System.exit(1);
		}

		(function() {
			var container = $api.slime.settings.getContainerArguments();
			for (var i=0; i<container.length; i++) {
				$api.debug("container " + container[i]);
				// TODO: test whether this works for Graal
				command.vm(container[i]);
			}
		})();
		$api.slime.settings.sendPropertiesTo(command);

		var compilerMajorVersion = (jshLoaderJavaMajorVersion < jshLauncherJavaMajorVersion) ? jshLoaderJavaMajorVersion : jshLauncherJavaMajorVersion;
		var _shellUrls = shell.shellClasspath({ source: String(compilerMajorVersion), target: String(compilerMajorVersion) });
		$api.debug("_shellUrls = " + _shellUrls);
		for (var i=0; i<_shellUrls.length; i++) {
			_urls.push(_shellUrls[i]);
		}
		$api.debug("_urls = " + _urls);

		//	TODO	document, generalize
		if ($api.slime.settings.get("jsh.shell.classpath")) {
			var files = $api.slime.settings.get("jsh.shell.classpath").split(String(Packages.java.io.File.pathSeparator));
			for (var i=0; i<files.length; i++) {
				_urls.push(new Packages.java.io.File(files[i]).toURI().toURL());
			}
		}
		$api.debug("_urls = " + _urls);

		var classpath = new $api.jsh.Classpath(_urls);

		var engine = $api.jsh.engines[$api.slime.settings.get("jsh.engine")];
		if (!engine) throw new Error("Specified engine [" + $api.slime.settings.get("jsh.engine") + "]" + " not found;"
			+ " JSH_ENGINE=" + $api.shell.environment.JSH_ENGINE
			+ " jsh.engine=" + Packages.java.lang.System.getProperty("jsh.engine")
			+ " shell=" + shell
		);

		//	TODO	Are we really using classloader launch under Rhino?
		var fork = engine.resolve({
			rhino: false,
			nashorn: true,
			graal: true
		});
		$api.debug("Fork = " + fork);

		if (fork) command.fork();

		for (var i=0; i<classpath._urls.length; i++) {
			command.classpath(classpath._urls[i]);
		}

		command.main(engine.main);

		for (var i=0; i<$api.arguments.length; i++) {
			$api.debug("argument: " + $api.arguments[i]);
			command.argument($api.arguments[i]);
		}

		command.systemProperty("jsh.launcher.jrunscript", $api.java.install.jrunscript.getCanonicalPath());

		//	TODO	try to figure out a way to get rid of HTTP property passthrough; used for testing of HTTP-based launch from GitHub
		var passthrough = ["http.proxyHost","http.proxyPort","https.proxyHost","https.proxyPort","jsh.github.user","jsh.github.password"];
		var noProxy = $api.slime.settings.get("jsh.loader.noproxy");
		$api.debug("noProxy = " + noProxy);
		for (var i=0; i<passthrough.length; i++) {
			$api.debug("property = " + passthrough[i] + " value=" + Packages.java.lang.System.getProperty(passthrough[i]));
			if (noProxy && passthrough[i].substring(0,"http.".length) == "http.") continue;
			if (Packages.java.lang.System.getProperty(passthrough[i])) {
				command.systemProperty(passthrough[i], Packages.java.lang.System.getProperty(passthrough[i]));
			}
		}

		if ($api.embed) return;

		$api.debug("command = " + command);
		var status = command.run();
		//	This basically hard-codes the exit at the VM level, meaning this script cannot be embedded.
		$api.debug("exit status = " + status);
		if (typeof(status) != "undefined") {
			Packages.java.lang.System.exit(status);
		}
	}
//@ts-ignore
).call(this);
