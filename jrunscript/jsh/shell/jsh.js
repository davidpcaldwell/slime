//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
//	TODO	Redefine JavaAdapter to be slime.jrunscript.JavaAdapter
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { any } JavaAdapter
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.shell.internal.Context } $context
	 * @param { slime.loader.Export<slime.jsh.shell.internal.Exports> } $export
	 */
	function(Packages,JavaAdapter,$api,$context,$export) {
		var module = $context.module;

		/** @type { Pick<slime.jsh.shell.Exports,"Intention"|"engine"|"exit"|"stdio"|"echo"|"console"|"println"|"rhino"|"shell"|"jsh"|"run"|"world"|"stdin"|"stdout"|"stderr"> } */
		var $exports = {};

		//	TODO	would be nice to generalize this and push it back into the shell module itself
		if (!module.properties) throw new TypeError("No properties properties.");

		$exports.engine = module.properties.get("jsh.engine");

		$exports.exit = $context.exit;

		$exports.stdio = $context.stdio;
		// TODO: Can these methods below be replaced by using a Resource created from the InputStream? Are they documented anywhere? Can
		// they be eliminated? They are the last SLIME usage of the asXml() method
		["readLines", "asString", "asXml"].forEach(function(method) {
			$exports.stdio.input[method] = function(p) {
				return this.character()[method].apply(this.character(), arguments);
			}
		});

		["output","error"].forEach(function(name) {
			$exports.stdio[name].write = function(p) {
				$exports.stdio[name].character().write(p);
			}
		});

		//	TODO	these are deprecated
		$exports.stdin = $exports.stdio.input;
		$exports.stdout = $exports.stdio.output;
		$exports.stderr = $exports.stdio.error;

		/** @type { slime.jsh.shell.Exports["println"] } */
		var echo = (
			function() {
				var toString = function(message) {
					var convert = $api.deprecate(function(message) {
						/** @returns { string } */
						var getTypeof = function(v) {
							return typeof(v);
						};

						if (false) {
							throw new Error();
						} else if (typeof(message) == "number") {
							return String(message);
						} else if (typeof(message) == "boolean") {
							return String(message);
						} else if (typeof(message) == "function") {
							return message.toString();
						} else if (getTypeof(message) == "xml") {
							return message.toXMLString();
						} else if (message === null) {
							return "(null)";
						} else if (typeof(message) == "object") {
							return message.toString();
						} else if (typeof(message.toString == "function")) {
							return String(message.toString());
						} else {
							return "Host object: typeof = " + typeof(message);
						}
					});

					if (typeof(message) == "string") {
						return message;
					} else if (message === null) {
						return "(null)";
					} else if (typeof(message) == "undefined") {
						return "(undefined)";
					} else {
						return convert(message);
					}
				};

				var streamToConsole = function(stream,toString) {
					var writer = (function() {
						//	TODO	is this redundancy necessary? Does isJavaType(...) need to know it is a Java object?
						if ($context.api.java.isJavaObject(stream) && $context.api.java.isJavaType(Packages.java.io.OutputStream)(stream)) return $context.api.io.Streams.java.adapt(stream).character();
						if ($context.api.java.isJavaObject(stream) && $context.api.java.isJavaType(Packages.java.io.Writer)(stream)) return $context.api.io.Streams.java.adapt(stream);
						if (stream && typeof(stream.character) == "function") return stream.character();
						if (stream && typeof(stream.write) == "function") return stream;
						if (stream && typeof(stream) == "object") throw new TypeError("Not a recognized stream: " + stream + " with properties " + Object.keys(stream));
						throw new TypeError("Not a recognized stream: " + stream);
					})();
					return function(message) {
						writer.write(toString(message) + module.properties.get("line.separator"));
					}
				};

				return function(message,mode) {
					if (arguments.length == 0) message = "";

					var console = streamToConsole(mode.stream,toString);

					console(message);
				};
			}
		)();

		/** @type { slime.jsh.shell.Exports["echo"] } */
		$exports.echo = function(message) {
			echo(message, { stream: $context.stdio.output });
		};

		$exports.console = function(message) {
			//	TODO	probably can use $context rather than $exports
			echo(message, { stream: $exports.stdio.error });
		};

		$exports.println = echo;

		var stream = function(stdio,x) {
			if (typeof(stdio[x]) == "undefined") {
				return $exports.stdio[x];
			}
			return stdio[x];
		}

		var shell = (
			/**
			 *
			 * @param { slime.jsh.shell.old.shell.Argument } p
			 * @returns
			 */
			function(p) {
				if (arguments.length >= 2) {
					$api.deprecate(function() {
						p = $api.Object.compose(
							{
								command: arguments[0],
								arguments: arguments[1]
							},
							arguments[2]
						);
					}).apply(this,arguments);
				}

				if (!p.command) {
					throw new TypeError("No command given: arguments = " + Array.prototype.join.call(arguments,"|"));
				}

				/** @type { slime.jsh.shell.old.shell.Argument } */
				var run = $api.Object.compose(p);

				/** @typedef { slime.jsh.shell.old.shell.Argument["command"] } Command */

				/** @type { (command: Command) => command is slime.jrunscript.file.Pathname } */
				var isPathname = function(command) {
					return Boolean(command["file"]) && !Boolean(command["pathname"]);
				};

				/** @type { (command: Command) => command is string } */
				var isString = function(command) {
					return typeof(command) == "string";
				};

				var file = (function() {
					var it = run.command;
					if (isPathname(it)) {
						return it.file;
					} else if (isString(it)) {
						var s = it;
						return $api.deprecate(function() {
							return $context.api.file.Pathname(s).file;
						})();
					} else {
						return it;
					}
				})();

				/** @type { Omit<slime.jsh.shell.old.shell.Argument,"command"> & { command: slime.jrunscript.file.File }} */
				var now = $api.Object.compose(run, { command: file });

				(function() {
					/** @typedef { string | slime.jrunscript.file.Pathname } Argument */
					/** @type { (item: Argument) => item is slime.jrunscript.file.Pathname } */
					var argumentIsPathname = function(item) {
						return Boolean(item["java"]);
					}

					/**
					 *
					 * @param { Argument } item
					 * @returns { Argument }
					 */
					var preprocessor = function(item) {
						if (now.filesystem) {
							if (argumentIsPathname(item) && now.filesystem.java && now.filesystem.java.adapt) {
								var _file = item.java.adapt();
								return now.filesystem.java.adapt(_file);
							}
						}
						return item;
					};
					if (now.arguments) {
						now.arguments = now.arguments.map(preprocessor);
					}
				})();

				(function() {
					if (!now.evaluate && now.onExit) {
						now.evaluate = $api.deprecate(now.onExit);
					}
				})();

				return $exports.run(now);
			}
		);

		/**
		 * @type { (p: slime.jsh.shell.old.shell.Argument | string) => p is slime.jsh.shell.old.shell.Argument }
		 */
		var isSingleArgument = function(p) {
			if (typeof(p) == "string") return false;
			return Boolean(p.command);
		}

		//@ts-ignore
		$exports.shell = function(command, args, mode) {
			if (!isSingleArgument(command)) {
				/** @type { slime.jsh.shell.old.shell.Argument } */
				var p = $api.Object.compose(
					{
						command: command,
						arguments: args,
						evaluate: $api.fp.identity
					},
					mode
				);
				return shell(p);
			} else {
				/** @type { slime.jsh.shell.old.shell.Argument } */
				var single = command;
				return shell(single);
			}
		}

		//	TODO	is rhino/file.filesystem.$jsh.os(...) still necessary? Was used here.

		//	TODO	make sure documentation correctly reflects presence of this property: this property being present does not mean Rhino
		//			is executing this script, just that it is present
		if (module.properties.get("jsh.engine.rhino.classpath")) {
			$exports.rhino = {
				classpath: module.properties.searchpath("jsh.engine.rhino.classpath")
			};
		}

		/**
		 * @type { (p: slime.jsh.shell.oo.Invocation) => p is slime.jsh.shell.oo.ForkInvocation }
		 */
		var isForkInvocation = function(p) {
			if (p["fork"]) return true;
			//	Was documented but unused; could re-implement
			//if (p.classpath) return true;
			if (p.environment && p.environment.JSH_SCRIPT_CLASSPATH) return true;
			if (p.environment && p.environment.JSH_PLUGINS != module.environment.JSH_PLUGINS) return true;
			if (p.environment && p.environment.JSH_DEBUG_SCRIPT != module.environment.JSH_DEBUG_SCRIPT) return true;
			if (p["shell"]) return true;
			//	TODO	allow unforked URL-based scripts
			//	TODO	this seems to indicate that the argument p.script need not be a file, but can be a URL
			if (typeof(p.script["resolve"]) == "function") return true;
			return false;
		}

		/**
		 *
		 * @param { { shell?: slime.jrunscript.file.Directory, environment?: slime.jrunscript.shell.Exports["environment"] }} p
		 * @param { boolean } fork
		 * @returns { slime.jrunscript.shell.Exports["environment"] }
		 */
		var getJshEnvironment = function(p,fork) {
			/** @type { slime.js.Cast<slime.jrunscript.shell.Exports["environment"]> } */
			var toReadOnly = $api.fp.cast.unsafe;

			//	TODO	Probably if p.shell is specified and p.environment is not, we should strip out all variables starting with JSH_,
			//			which would provide the least counterintuitive behavior. For example, if called from unbuilt shell, we would want
			//			a launched built shell to have all the unbuilt shell environment variables removed.
			if (p.environment) return p.environment;
			if (p.shell || fork) {
				var rv = {};
				for (var x in module.environment) {
					if (x == "JSH_DEBUG_JDWP") {
						//	do not copy; exclude
					} else if (/^JSH_/.test(x) && !/^JSH_HOST_/.test(x) && x != "JSH_LOCAL_JDKS" && x != "JSH_SHELL_LIB") {
						//	We are copying JSH_LOCAL_JDKS/JSH_SHELL_LIB to try to support the Linux VM use case right now. Hard to
						//	say what the "right" behavior is surrounding any of this, so just hard-coding that behavior for now.
						if (p.shell) {
							//	do not copy; exclude
						} else {
							rv[x] = module.environment[x];
						}
					} else {
						rv[x] = module.environment[x];
					}
				}
				return toReadOnly(rv);
			}
			return module.environment;
		};

		/**
		 *
		 * @param { slime.jsh.shell.oo.ForkInvocation } p
		 */
		var getJrunscriptForkCommand = function(p) {
			var newEvaluateWithInvocationDataAdded = function(evaluate) {
				if (evaluate) {
					return function(result) {
						result.jsh = {
							script: p.script,
							arguments: p.arguments
						};
						result.classpath = p.classpath;
						return p.evaluate(result);
					}
				}
			};

			var addLoaderArgumentsTo = function(jargs,script) {
				if (p.vmarguments) {
					p.vmarguments.forEach(function(argument) {
						jargs.push(argument);
					});
				}
				if (p.properties) {
					for (var x in p.properties) {
						jargs.push("-D" + x + "=" + p.properties[x]);
					}
				}
				jargs.push(script);
				p.arguments.forEach( function(arg) {
					jargs.push(arg);
				});
				return jargs;
			}

			//	TODO	next function and next variable are repeated from jrunscript/jsh/launcher/main.js
			function javaMajorVersionString(javaVersionProperty) {
				if (/^1\./.test(javaVersionProperty)) return javaVersionProperty.substring(2,3);
				return javaVersionProperty.split(".")[0];
			}

			var javaMajorVersion = Number(javaMajorVersionString(String(Packages.java.lang.System.getProperty("java.version"))));

			//	Also in rhino/shell/module.js
			var getNashornDeprecationArguments = function() {
				if (javaMajorVersion >= 9 && javaMajorVersion <= 14) return ["-Dnashorn.args=--no-deprecation-warning"];
				return [];
			}

			var bootstrapShellInvocationArguments = getNashornDeprecationArguments().concat((function(shell) {
				/** @param { slime.jrunscript.file.Directory } src */
				var unbuilt = function(src) {
					/** @type { string[] } */
					var rv = [];
					//	TODO	should only do this for post-Nashorn JDK versions
					if (javaMajorVersion >= 15 && src.getFile("local/jsh/lib/nashorn.jar")) {
						var libraries = $context.api.bootstrap.nashorn.dependencies.names;
						var lib = src.getSubdirectory("local/jsh/lib");
						rv.push(
							"-classpath",
							libraries.map(function(name) {
								return lib.getRelativePath(name + ".jar")
							}).concat([
								lib.getRelativePath("nashorn.jar")
							])
							//	TODO	this is OS-specific
								.join(":")
						);
					}
					rv.push(
						src.getFile("rhino/jrunscript/api.js").pathname.toString(),
						"jsh"
					);
					return rv;
				};

				/**
				 *
				 * @param { slime.jrunscript.file.Directory } home
				 */
				var built = function(home) {
					/** @type { string[] } */
					var rv = [];
					if (home.getFile("lib/nashorn.jar")) {
						var lib = home.getSubdirectory("lib");
						rv.push("-classpath");
						rv.push(
							$context.api.bootstrap.nashorn.dependencies.jarNames
								.map(function(name) { return lib.getRelativePath(name); })
								.concat([lib.getRelativePath("nashorn.jar")])
								.join(":")
						)
					}
					rv.push(home.getFile("jsh.js").pathname.toString());
					return rv;
				};

				var remote = function(url) {
					return [
						"-e",
						"load('" + url.resolve("rhino/jrunscript/api.js?jsh") + "')"
					];
				}

				if (shell) {
					//	TODO	should contemplate possibility of URL, I suppose
					if (shell.getFile("jsh.js")) {
						return built(shell);
					}
					if (shell.getFile("rhino/jrunscript/api.js")) {
						return unbuilt(shell);
					}
					throw new Error("Shell not found: " + shell);
				}

				if ($exports.jsh.home) return built($exports.jsh.home);
				if ($exports.jsh.src) return unbuilt($exports.jsh.src);
				if ($exports.jsh.url) return remote($exports.jsh.url);

				//	TODO	would unbuilt remote shells have a src property, and would it work?
				throw new Error("Currently running jsh shell lacks home, src, and url properties; bug.");
			})(p.shell));

			var isRemoteShell = bootstrapShellInvocationArguments[0] == "-e";

			//	Properties to be sent to main.js launcher; other properties will be sent as arguments using addCommandTo
			var launcherProperties = {};

			var copySystemPropertyToLauncherPropertiesIfPresent = function(name) {
				//	TODO	is the below redundant with an API we already have for accessing the value (other than system property?)
				if (Packages.java.lang.System.getProperty(name)) {
					launcherProperties[name] = String(Packages.java.lang.System.getProperty(name));
				}
			};

			if (p.classpath) {
				launcherProperties["jsh.shell.classpath"] = String(p.classpath);
			}

			copySystemPropertyToLauncherPropertiesIfPresent("jsh.engine.rhino.classpath");

			if (isRemoteShell) {
				copySystemPropertyToLauncherPropertiesIfPresent("http.proxyHost");
				copySystemPropertyToLauncherPropertiesIfPresent("http.proxyPort");
				copySystemPropertyToLauncherPropertiesIfPresent("https.proxyHost");
				copySystemPropertyToLauncherPropertiesIfPresent("https.proxyPort");
			}

			//	TODO	the jrunscript method also handles vmarguments, perhaps we should pass those through?
			var argument = $api.Object.compose(p, {
				environment: getJshEnvironment(p,true),
				vmarguments: [],
				properties: launcherProperties,
				arguments: addLoaderArgumentsTo(bootstrapShellInvocationArguments,p.script),
				evaluate: newEvaluateWithInvocationDataAdded(p.evaluate)
			});

			return argument;
		}

		/** @type { (shell: slime.jsh.shell.Installation) => shell is slime.jsh.shell.UnbuiltInstallation } */
		var isUnbuilt = function(shell) {
			return Boolean(shell["src"]);
		};

		/** @type { (p: slime.jsh.shell.Intention) => p is slime.jsh.shell.ExternalInstallationProgram } */
		var isExternalInstallationInvocation = function(p) {
			return Boolean(p["shell"]);
		}

		//	TODO	can this move into unbuiltToShellIntention?
		/** @type { (p: slime.jsh.shell.UnbuiltInstallation) => slime.jrunscript.file.Location } */
		var getSrcLauncher = function(p) {
			return $context.api.file.Location.directory.relativePath("jsh")($context.api.file.Location.from.os(p.src));
		};

		/** @param { slime.jsh.shell.Intention["properties"] } properties */
		var getPropertyArguments = function(properties) {
			return Object.entries(properties).reduce(function(rv,entry) {
				//	TODO	is any sort of escaping or anything required here? What if value has spaces? What if
				//			name does?
				rv.push("-D" + entry[0] + "=" + entry[1]);
				return rv;
			},[])
		}

		/** @type { (s: slime.jsh.shell.UnbuiltInstallation) => (p: slime.jsh.shell.Intention) => slime.jrunscript.shell.run.Intention } */
		var unbuiltToShellIntention = function(s) {
			return function(p) {
				if (!isExternalInstallationInvocation(p)) throw new Error();
				return {
					//	TODO	will not work on Windows
					command: "bash",
					arguments: $api.Array.build(function(rv) {
						rv.push(getSrcLauncher(s).pathname);
						if (p.properties) rv.push.apply(rv, getPropertyArguments(p.properties));
						rv.push(p.script);
						if (p.arguments) rv.push.apply(rv, p.arguments);
					}),
					directory: p.directory,
					environment: p.environment,
					stdio: p.stdio
				}
			}
		}

		/** @type { (p: slime.jsh.shell.Intention) => slime.jrunscript.shell.run.Intention } */
		var jshIntentionToShellIntention = function(p) {
			/** @type { slime.$api.fp.Identity<slime.jsh.shell.BuiltInstallation> } */
			var asBuiltInstallation = $api.fp.identity;

			var getHomeBashLauncher = $api.fp.pipe(
				asBuiltInstallation,
				$api.fp.property("home"),
				$context.api.file.Location.from.os,
				$context.api.file.Location.directory.relativePath("jsh.bash")
			);

			var getHomeNativeLauncher = $api.fp.pipe(
				asBuiltInstallation,
				$api.fp.property("home"),
				$context.api.file.Location.from.os,
				$context.api.file.Location.directory.relativePath("jsh")
			);

			/** @type { (shell: slime.jsh.shell.Installation) => shell is slime.jsh.shell.BuiltInstallation } */
			var isBuilt = function(shell) {
				return Boolean(shell["home"]);
			};

			if (isExternalInstallationInvocation(p)) {
				var shell = p.shell;
				if (isUnbuilt(shell)) {
					//	Below is necessary for TypeScript as of 5.1.6
					var s = shell;
					return unbuiltToShellIntention(s)(p);
				} else if (isBuilt(shell)) {
					var addPropertiesArguments = function(rv,p) {
						if (p.properties) {
							for (var x in p.properties) {
								rv.push("-D" + x + "=" + p.properties[x]);
							}
						}
					};

					//	TODO #1415	support this
					var downcast = shell;
					var bashLauncher = getHomeBashLauncher(downcast);
					var nativeLauncher = getHomeNativeLauncher(downcast);
					if ($api.fp.now(nativeLauncher, $context.api.file.Location.file.exists.simple)) {
						return {
							command: nativeLauncher.pathname,
							arguments: $api.Array.build(function(rv) {
								addPropertiesArguments(rv, p);
								rv.push(p.script);
								if (p.arguments) rv.push.apply(rv, p.arguments);
							}),
							directory: p.directory,
							environment: p.environment,
							stdio: p.stdio
						};
					} else if ($context.PATH.getCommand("bash") && $api.fp.now(bashLauncher, $context.api.file.Location.file.exists.simple)) {
						return {
							command: "bash",
							arguments: $api.Array.build(function(rv) {
								rv.push(getHomeBashLauncher(downcast).pathname);
								addPropertiesArguments(rv, p);
								rv.push(p.script);
								if (p.arguments) rv.push.apply(rv, p.arguments);
							}),
							directory: p.directory,
							environment: p.environment,
							stdio: p.stdio
						}
					} else {
						throw new Error("Built shell requires: bash with bash launcher, or native launcher.");
					}
				} else {
					throw new Error("Unsupported external shell.");
				}
			} else {
				return {
					//	TODO	allow Java to be specified
					command: module.java.launcher.pathname.toString(),
					arguments: $api.Array.build(function(rv) {
						rv.push("-jar", p.package);
						if (p.arguments) rv.push.apply(rv, p.arguments);
					}),
					directory: p.directory,
					environment: p.environment,
					stdio: p.stdio
				}
			}
		}

		$exports.jsh = Object.assign(
			/**
			 * @type { slime.jsh.shell.Exports["run"] }
			 */
			function(p) {
				//	Deal with old, two-argument form
				if (!arguments[0].script && !arguments[0].arguments) {
					$api.deprecate(function() {
						p = {
							script: arguments[0],
							arguments: (arguments[1]) ? arguments[1] : []
						};
						for (var x in arguments[2]) {
							p[x] = arguments[2][x];
						}
					}).apply(this,arguments);
				}

				if (!p.script) {
					throw new TypeError("Required: script property indicating script to run.");
				}
				var argumentsFactory = $api.fp.mutating(p.arguments);
				p.arguments = argumentsFactory([]);

				if (p.script["file"] && !p.script.pathname) {
					$api.deprecate(function() {
						//	User supplied Pathname; should have supplied file
						p.script = p.script["file"];
					})();
				}
				//	TODO	need to detect directives in the given script and fork if they are present

				//var fork = getJshFork(p);

				if (isForkInvocation(p)) {
					var jrunscriptForkConfiguration = getJrunscriptForkCommand(p);

					// var bashResult = module.run({
					// 	command: "bash",
					// 	arguments: $api.Array.build(function(rv) {
					// 		rv.push();
					// 	})
					// })

					return module.jrunscript(
						$api.Object.compose(
							jrunscriptForkConfiguration,
							{
								jrunscript: module.properties.file("jsh.launcher.jrunscript")
							}
						)
					);
				} else {
					var directory = (function() {
						if (p.directory) return p.directory;
						if (p.workingDirectory) return p.workingDirectory;
					})();
					var environment = getJshEnvironment(p,false);
					var configuration = new JavaAdapter(
						Packages.inonit.script.jsh.Shell.Environment,
						new function() {
							var specified = $exports.run.stdio.run(p);

							var stdio = new JavaAdapter(
								Packages.inonit.script.jsh.Shell.Environment.Stdio,
								new function() {
									var Streams = Packages.inonit.script.runtime.io.Streams;

									var ifNonNull = function(_type,value,otherwise) {
										if ($context.api.java.isJavaType(_type)(value)) return value;
										if (value && !value.java) throw new TypeError("value: " + value);
										return (value) ? value.java.adapt() : otherwise;
									}

									var stdio = specified;

									var _stdin = ifNonNull(Packages.java.io.InputStream, stream(stdio,"input"), Streams.Null.INPUT_STREAM);
									var _stdout = ifNonNull(Packages.java.io.OutputStream, stream(stdio,"output"), Streams.Null.OUTPUT_STREAM);
									var _stderr = ifNonNull(Packages.java.io.OutputStream, stream(stdio,"error"), Streams.Null.OUTPUT_STREAM);

									this.getStandardInput = function() {
										return _stdin;
									}

									this.getStandardOutput = function() {
										return _stdout;
									}

									this.getStandardError = function() {
										return _stderr;
									}
								}
							);

							// //	For now, we supply an implementation that logs to stderr, just like the launcher-based jsh does, although it is
							// //	possible we should revisit this
							// var log = new JavaAdapter(
							// 	Packages.inonit.script.rhino.Engine.Log,
							// 	new function() {
							// 		this.println = function(message) {
							// 			new Packages.java.io.PrintStream(stdio.getStandardError()).println(message);
							// 		}
							// 	}
							// );

							// this.getLog = function() {
							// 	return log;
							// }

							this.getClassLoader = function() {
								return Packages.java.lang.ClassLoader.getSystemClassLoader();
							}

							this.getSystemProperties = function() {
								var rv = new Packages.java.util.Properties();
								var keys = $context._getSystemProperties().keySet().iterator();
								while(keys.hasNext()) {
									var key = keys.next();
									// if (String(key) != "jsh.shell.packaged") {
									if ($context._getSystemProperties().getProperty(key) == null) {
										//	TODO	seems to be the case for jsh.launcher.shell, through an unknown set of mechanisms
									} else {
										rv.setProperty(key, $context._getSystemProperties().getProperty(key));
									}
									// }
								}
								if (directory) {
									rv.setProperty("user.dir", directory.pathname.java.adapt());
								}
								return rv;
							}

							var _environment = (function() {
								var _map = new Packages.java.util.HashMap();
								for (var x in environment) {
									//	TODO	think through what types might be in environment
									var value = (function() {
										if (typeof(environment[x]) == "undefined") return null;
										if (environment[x] === null) return null;
										return String(environment[x]);
									})();
									_map.put(new Packages.java.lang.String(x),new Packages.java.lang.String(value));
								}
								return Packages.inonit.system.OperatingSystem.Environment.create(_map);
							})();

							this.getEnvironment = function() {
								return _environment;
							};

							this.getStdio = function() {
								return stdio;
							}

							this.getPackaged = function() {
								return null;
							};
						}
					);

					if (!p.script || !p.script.pathname || !p.script.pathname.java || !p.script.pathname.java.adapt) {
						throw new TypeError("Expected script " + p.script + " to have pathname.java.adapt()");
					}
					var status = $context.jsh(
						configuration,
						p.script,
						p.arguments.map(String)
					);

					var evaluate = (p.evaluate) ? p.evaluate : function(result) {
						if (result.status === null) {
							result.status = 0;
						}
						if (result.status) {
							throw new Error("Exit status: " + result.status);
						}
						return result;
					};

					return evaluate({
						status: status,
						//	no error property
						//	no command or arguments
						jsh: {
							script: p.script,
							arguments: p.arguments
						},
						//	TODO	was unused, but documented; perhaps should bring back through refactoring
						//classpath: p.classpath,
						environment: environment,
						directory: directory,
						workingDirectory: directory
					});
				}
			},
			{
				require: void(0),
				relaunch: void(0),
				debug: void(0),
				url: void(0),
				Installation: void(0),
				/** @type { slime.jsh.shell.JshShellJsh["Intention" ]} */
				Intention: {
					toShellIntention: jshIntentionToShellIntention,
					sensor: function(p) {
						return function(events) {
							if (isExternalInstallationInvocation(p)) {
								if (isUnbuilt(p.shell)) {
									return $api.fp.world.Sensor.now({
										sensor: $context.module.subprocess.question,
										subject: jshIntentionToShellIntention(p),
										handlers: {
											stderr: function(e) {
												events.fire("stderr", e.detail);
											},
											stdout: function(e) {
												events.fire("stdout", e.detail);
											}
										}
									});
								} else {
									throw $api.TODO()();
								}
							} else {
								throw $api.TODO()();
							}
						}
					}
				}
			}
		);

		/** @type { slime.jsh.shell.JshShellJsh["Installation"] } */
		var Installation = {
			from: {
				current: function() {
					var packaged = $context.packaged();
					if (module.properties.object.jsh && module.properties.object.jsh.shell && module.properties.object.jsh.shell.src) {
						var src = canonicalizePropertyValue(module.properties.object.jsh.shell.src);
						if ($context.api.file.Pathname(src).directory) {
							return {
								src: src
							}
						} else {
							return {
								url: src
							}
						}
					} else if (module.properties.object.jsh && module.properties.object.jsh.shell && module.properties.object.jsh.shell.home) {
						var home = canonicalizePropertyValue(module.properties.object.jsh.shell.home);
						if ($context.api.file.Pathname(home).directory) {
							return {
								home: home
							}
						}
					} else if (packaged.present) {
						return {
							package: canonicalize(packaged.value)
						}
					}
				}
			},
			is: {
				/** @type { slime.jsh.shell.JshShellJsh["Installation"]["is"]["unbuilt"] } */
				unbuilt: function(p) {
					return Boolean(p["src"]);
				},
				/** @type { slime.jsh.shell.JshShellJsh["Installation"]["is"]["packaged"] } */
				packaged: function(p) {
					return Boolean[p["package"]];
				}
			}
		};

		$exports.jsh.relaunch = $api.experimental(
			function(p) {
				var shell = Installation.from.current();
				/** @type { slime.jsh.shell.Program } */
				var program = (Installation.is.packaged(shell)) ? {
					package: shell.package
				} : {
					shell: shell,
					script: $context.api.script.file.pathname.toString()
				};
				/** @type { slime.jsh.shell.Intention } */
				var priorIntention = (
					function() {
						return $api.Object.compose(
							program,
							/** @type { Partial<slime.jsh.shell.Intention> } */
							({
								arguments: $context.api.script.arguments,
								environment: $api.fp.identity,
								directory: $context.module.process.directory.get(),
								properties: $context.api.java.vm.properties(),
								stdio: void(0)
							})
						)
					}
				)();
				var intention = (p) ? p(priorIntention) : priorIntention;
				var shellIntention = jshIntentionToShellIntention(intention);
				var result = $api.fp.world.Sensor.now({
					sensor: $context.module.subprocess.question,
					subject: shellIntention
				});
				$exports.exit(result.status);
			}
		);

		/** @type { slime.jsh.shell.Exports["jsh"]["require"] } */
		$exports.jsh.require = function(p) {
			return function(events) {
				//  TODO    should develop a strategy for preventing infinite loops
				if (!p.satisfied()) {
					events.fire("installing");
					p.install();
					events.fire("installed");
					$exports.jsh.relaunch();
				} else {
					events.fire("satisfied");
				}
			}
		};

		$exports.run = (function(was) {
			/** @type { slime.js.Cast<slime.jsh.shell.Exports["run"]> } */
			var cast = $api.fp.cast.unsafe;

			var is = cast(was);
			is.evaluate.wrap = function(result) {
				$exports.exit(result.status);
			};
			is.evaluate.jsh = {
				wrap: void(0)
			};
			is.evaluate.jsh.wrap = function(result) {
				$exports.exit(result.status);
			}
			return is;
		})(module.run);

		//if (String($exports.properties.object.jsh.plugins)) {
		//	$exports.jsh.plugins = $context.api.file.filesystem.Searchpath.parse(String($exports.properties.object.jsh.plugins));
		//}

		// Packages.java.lang.System.err.println(String(Packages.java.lang.System.getProperties()));
		// Packages.java.lang.System.err.println(JSON.stringify($exports.properties.object,void(0),"    "));
		if (module.properties.object.jsh && module.properties.object.jsh.shell && module.properties.object.jsh.shell.home) {
			$exports.jsh.home = $context.api.file.Pathname(module.properties.object.jsh.shell.home).directory
		}
		if (module.properties.object.jsh && module.properties.object.jsh.shell && module.properties.object.jsh.shell.src) {
			(function() {
				var src = String(module.properties.object.jsh.shell.src);
				if ($context.api.file.Pathname(src).directory) {
					$exports.jsh.src = $context.api.file.Pathname(src).directory;
				} else {
					$exports.jsh.url = $context.api.js.web.Url.parse(src);
				}
			})();
		}
		if (module.properties.object.jsh && module.properties.object.jsh.shell && module.properties.object.jsh.shell.lib) {
			$exports.jsh.lib = $context.api.file.Pathname(module.properties.object.jsh.shell.lib).directory;
		} else if ($exports.jsh.home) {
			$exports.jsh.lib = $exports.jsh.home.getSubdirectory("lib");
		}

		var canonicalize = function(ospath) {
			var os = $context.api.file.Location.from.os(ospath);
			//	TODO	we need a wo API to canonicalize
			var canonicalized = $context.api.file.Location.directory.relativePath("foo")(os);
			var directory = $context.api.file.Location.parent()(canonicalized);
			return directory.pathname;
		}

		var canonicalizePropertyValue = function(_value) {
			var value = String(_value);
			return canonicalize(value);
		}

		$exports.jsh.Installation = Installation;

		$exports.world = (function(was) {
			/** @type { slime.js.Cast<slime.jsh.shell.Exports["world"]> } */
			var cast = $api.fp.cast.unsafe;

			var is = cast(was);
			is.exit = function(status) {
				return function() {
					$context.exit(status);
				}
			};
			return is;
		})(module.world);

		var exported = Object.assign(
			module,
			{
				PATH: module.PATH
			},
			$exports
		);

		$api.deprecate(exported,"stdin");
		$api.deprecate(exported,"stdout");
		$api.deprecate(exported,"stderr");

		$export(exported);
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$export);
