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
	 * @param { slime.jrunscript.shell.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.shell.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		if (!$context.api.io) {
			throw new Error("Missing: $context.api.io");
		}

		/** @type { Pick<slime.jrunscript.shell.Exports,"TMPDIR"|"USER"|"HOME"|"PWD"|"PATH"|"os"|"invocation"|"user"|"system"|"java"|"jrunscript"|"rhino"|"kotlin"|"Invocation"|"world"|"Tell"|"environment"|"browser"> } */
		var $exports = {};

		var module = {
			events: $api.events.create()
		};

		var environment = $context.api.java.Environment( ($context._environment) ? $context._environment : Packages.inonit.system.OperatingSystem.Environment.SYSTEM );

		/**
		 *
		 * @param { slime.jrunscript.file.Pathname } osPathname
		 */
		var toLocalPathname = function(osPathname) {
			var _rv = osPathname.java.adapt();
			return $context.api.file.filesystem.java.adapt(_rv);
		};

		var properties = (
			/**
			 * @returns { slime.jrunscript.shell.Exports["properties"] }
			 */
			function() {
				var _properties = ($context._properties) ? $context._properties : Packages.java.lang.System.getProperties();

				return {
					object: $context.api.java.Properties.adapt( _properties ),
					get: function(name) {
						var rv = _properties.getProperty(name);
						if (!rv) return null;
						return String(rv);
					},
					file: function(name) {
						return toLocalPathname($context.api.file.filesystems.os.Pathname(this.get(name))).file;
					},
					directory: function(name) {
						return toLocalPathname($context.api.file.filesystems.os.Pathname(this.get(name))).directory;
					},
					searchpath: function(name) {
						var string = this.get(name);
						if (!string) throw new Error("No property: " + name);
						var rv = $context.api.file.filesystems.os.Searchpath.parse(string);
						var pathnames = rv.pathnames.map(toLocalPathname);
						return $context.api.file.Searchpath(pathnames);
					}
				}
			}
		)();

		$api.experimental(properties,"object");

		$exports.TMPDIR = properties.directory("java.io.tmpdir");
		$exports.USER = properties.get("user.name");
		$exports.HOME = properties.directory("user.home");
		if (properties.get("user.dir")) {
			$exports.PWD = properties.directory("user.dir");
		}
		var toLocalSearchpath = function(searchpath) {
			return $context.api.file.Searchpath($context.api.file.filesystems.os.Searchpath.parse(searchpath).pathnames.map(toLocalPathname));
		};
		if (environment.PATH) {
			$exports.PATH = toLocalSearchpath(environment.PATH);
		} else if (environment.Path) {
			//	Windows
			$exports.PATH = toLocalSearchpath(environment.Path);
		} else {
			$exports.PATH = $context.api.file.Searchpath([]);
		}

		var code = {
			/** @type { slime.jrunscript.shell.internal.run.Script } */
			run: $loader.script("run.js"),
			/** @type { slime.jrunscript.shell.internal.run.old.Script } */
			run_old: $loader.script("run-old.js")
		};

		/** @type { slime.jrunscript.shell.internal.invocation.Export } */
		var invocation = (
			function($api,$context) {
				var parseCommandToken = (
					function() {
						var ArgumentError = $api.Error.old.Type({ name: "ArgumentError", extends: TypeError });

						/**
						 *
						 * @param { slime.jrunscript.shell.invocation.old.Token } arg
						 * @param { number } [index]
						 * @returns { string }
						 */
						var rv = function(arg,index) {
							if (arguments.length == 1) index = null;
							var label = (typeof(index) == "number") ? "property 'arguments[" + String(index) + "]'" : "property 'command'";
							if (typeof(arg) == "undefined") {
								throw new ArgumentError(label + " cannot be undefined");
							}
							if (arg === null) throw new ArgumentError(label + " must not be null");
							if (arg && typeof(arg) == "object") return String(arg);
							//	TODO	the below check does not allow the empty string to be a token
							if (arg && typeof(arg) == "string") return arg;
							throw new ArgumentError(label + " is not a string nor an object that can be converted to string.");
						}
						rv.Error = ArgumentError;
						return rv;
					}
				)();

				/**
				 *
				 * @param { slime.jrunscript.shell.invocation.Input } p
				 * @return { slime.jrunscript.runtime.io.InputStream }
				 */
				var toInputStream = function(p) {
					if (typeof(p) == "string") {
						var buffer = new $context.library.io.Buffer();
						buffer.writeText().write(p);
						buffer.close();
						return buffer.readBinary();
					} else {
						return p;
					}
				}

				/**
				 * @param { slime.jrunscript.shell.invocation.old.Stdio } p
				 * @return { slime.jrunscript.shell.internal.invocation.StdioWithInputFixed }
				 */
				var updateForStringInput = function(p) {
					/** @type { slime.jrunscript.shell.run.StdioConfiguration } */
					return {
						input: toInputStream(p.input),
						output: p.output,
						error: p.error
					};
				}

				/**
				 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
				 * @return { configuration is slime.jrunscript.shell.invocation.old.OutputStreamToLines }
				 */
				var isLineListener = function(configuration) {
					return configuration && Object.prototype.hasOwnProperty.call(configuration, "line");
				}

				/**
				 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
				 * @return { configuration is slime.jrunscript.shell.invocation.old.OutputStreamToString }
				 */
				var isString = function(configuration) {
					return configuration === String
				};

				/**
				 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
				 * @return { configuration is slime.jrunscript.shell.invocation.OutputStreamToStream }
				 */
				var isRaw = function(configuration) {
					return true;
				}

				/** @type { (configuration: slime.jrunscript.shell.invocation.old.OutputStreamConfiguration) => slime.jrunscript.shell.run.OutputCapture } */
				var toCapture = function(configuration) {
					if (isLineListener(configuration)) {
						return "line";
					} else if (isString(configuration)) {
						return "string";
					} else {
						return configuration;
					}
				}

				/**
				 *
				 * @param { slime.jrunscript.shell.internal.invocation.StdioWithInputFixed } declaration
				 * @return { slime.jrunscript.shell.run.StdioConfiguration }
				 */
				function toStdioConfiguration(declaration) {
					return {
						input: declaration.input,
						output: toCapture(declaration.output),
						error: toCapture(declaration.error)
					};
				}

				/**
				 *
				 * @param { slime.jrunscript.host.Environment } environment
				 * @param { slime.jrunscript.shell.sudo.Settings } settings
				 * @returns { slime.jrunscript.host.Environment }
				 */
				var getEnvironmentToSudo = function(environment, settings) {
					return $api.Object.compose(
						environment,
						(settings && settings.askpass) ? { SUDO_ASKPASS: settings.askpass } : {}
					)
				}

				/**
				 *
				 * @param { string } command
				 * @param { string[] } args
				 * @param { slime.jrunscript.shell.sudo.Settings } settings
				 * @returns { string[] }
				 */
				var getArgumentsToSudo = function(command, args, settings) {
					return $api.Array.build(function(array) {
						if (settings && settings.askpass) array.push("--askpass");
						if (settings && settings.nocache) array.push("--reset-timestamp")
						array.push(command);
						array.push.apply(array, args);
					});
				}

				/** @type { (defaults: slime.jrunscript.shell.run.Parent) => slime.jrunscript.shell.exports.Invocation["from"]["argument"] } */
				var create = function(defaults) {
					return function(p) {
						return {
							context: {
								environment: (p.environment) ? p.environment : defaults.environment,
								directory: (p.directory) ? p.directory.toString() : defaults.directory,
								stdio: {
									input: (function() {
										if (p.stdio && p.stdio.input) return toInputStream(p.stdio.input);
										return null;
									})(),
									output: (p.stdio && p.stdio.output) ? p.stdio.output : defaults.stdio.output,
									error: (p.stdio && p.stdio.error) ? p.stdio.error : defaults.stdio.error,
								}
							},
							configuration: {
								command: String(p.command),
								arguments: (p.arguments) ? p.arguments.map(String) : []
							}
						}
					}
				};

				/** @type { slime.jrunscript.shell.internal.invocation.Export["internal"]["old"] } */
				var internal = (
					function() {
						return {
							error: {
								BadCommandToken: parseCommandToken.Error
							},
							updateForStringInput: updateForStringInput,
							toStdioConfiguration: toStdioConfiguration,
							parseCommandToken: parseCommandToken,
							isLineListener: isLineListener
						}
					}
				)();

				return {
					exports: function(defaults) {
						//	TODO	this being undefined is just for testing at the moment, should think through how to make this less kludgy
						var withDefaults = (defaults) ? create(defaults) : void(0);
						return {
							from: {
								argument: withDefaults
							},
							create: (withDefaults) ? $api.deprecate(withDefaults) : void(0),
							//	TODO	sudo has preserve-env and preserver-env= flags. Should make the relationship more explicit
							//			between that and the environment provided normally, e.g., how could we pass an explicit environment
							//			to sudo? Maybe by transforming the command into an `env` command?
							sudo: function(settings) {
								return function(invocation) {
									return {
										context: {
											environment: getEnvironmentToSudo(invocation.context.environment, settings),
											directory: invocation.context.directory,
											stdio: invocation.context.stdio
										},
										configuration: {
											command: "sudo",
											arguments: getArgumentsToSudo(invocation.configuration.command, invocation.configuration.arguments, settings)
										}
									}
								}
							},
							handler: {
								stdio: {
									line: function(f) {
										var lastBlank = null;

										return function(e) {
											if (lastBlank) {
												f(lastBlank);
												lastBlank = null;
											}
											if (e.detail.line == "") {
												lastBlank = e;
											} else {
												f(e);
											}
										}
									}
								}
							}
						}
					},
					invocation: {
						//	The returned function is wrapped in this function because one could envision this function someday having
						//	arguments containing some sort of information about how the script should be authored, maybe the path
						//	to bash (which is different on FreeBSD), and so forth.
						toBashScript: function() {
							/** @type { ReturnType<slime.jrunscript.shell.Exports["invocation"]["toBashScript"]> } */
							var toScriptCode = function(invocation) {
								return $api.Array.build(function(script) {
									script.push("#!/bin/bash");

									if (invocation.directory) {
										if (typeof(invocation.directory) == "string") {
											script.push("cd " + invocation.directory);
										} else {
											script.push("cd " + invocation.directory.pathname.toString());
										}
									}

									/** @type { Parameters<ReturnType<slime.jrunscript.shell.Exports["invocation"]["toBashScript"]>>[0]["environment"]} */
									var environment = (invocation.environment) || { inherit: void(0), values: {} };
									var inherit = (typeof(environment.inherit) == "undefined") ? true : environment.inherit;
									var values = (typeof(environment.values) == "undefined") ? {} : environment.values;
									var set = Object.entries(values).filter(function(entry) {
										return typeof(entry[1]) == "string";
									});
									var unset = Object.entries(values).filter(function(entry) {
										return entry[1] === null;
									});

									script.push($api.Array.build(function(rv) {
										if (!inherit || set.length || unset.length) rv.push("env");
										unset.forEach(function(entry) {
											rv.push("-u", entry[0]);
										});
										set.forEach(function(entry) {
											rv.push(entry[0] + "=" + "\"" + entry[1] + "\"");
										});
										rv.push(invocation.command);
										if (invocation.arguments) rv.push.apply(rv, invocation.arguments);
									}).join(" "))
								}).join("\n");
							};

							return toScriptCode;
						}
					},
					internal: {
						old: internal
					}
				};
			}
		)($api,{ library: { io: $context.api.io }})

		var scripts = (function() {
			var run = code.run({
				api: {
					java: $context.api.java,
					io: $context.api.io,
					file: $context.api.file
				},
				spi: ($context.world && $context.world.subprocess)
			});
			return {
				run: run,
				run_old: code.run_old({
					api: {
						file: $context.api.file
					},
					environment: environment,
					module: module,
					os: {
						name: function() {
							return $exports.os.name;
						},
						newline: function() {
							return $exports.os.newline;
						}
					},
					scripts: {
						run: run,
						invocation: invocation
					},
					stdio: $context.stdio
				})
			}
		})();

		$exports.invocation = invocation.invocation;

		$exports.os = new function() {
			this.name = properties.get("os.name");
			this.arch = properties.get("os.arch");
			this.version = properties.get("os.version");
			this.newline = properties.get("line.separator");

			this.resolve = function(p) {
				if (typeof(p) == "function") {
					return p.call(this);
				} else if (typeof(p) == "object") {
					if (p[this.name]) return p[this.name];
					if (/^Windows/.test(this.name) && p.Windows) return p.Windows;
					if ( (this.name == "Linux" || this.name == "Mac OS X") && p.UNIX ) return p.UNIX;
				}
			};

			/** @type { slime.jrunscript.shell.internal.os.Script } */
			var code = $loader.script("os.js");

			var system = code({
				PATH: $exports.PATH,
				replacePath: function(PATH) {
					$exports.PATH = PATH;
				},
				TMPDIR: $exports.TMPDIR,
				os: this,
				run: scripts.run_old.run,
				environment: environment,
				api: {
					js: $context.api.js,
					io: $context.api.io,
					file: $context.api.file
				}
			});
			/** @type { slime.jrunscript.shell.system.ps } */
			var ps = this.resolve(system.ps);
			if (ps) {
				this.process = {
					list: ps
				};
			}
			if (system.sudo) this.sudo = system.sudo;
			if (system.ping) this.ping = system.ping;
			if (system.desktop) this.inject = function(inject) {
				system.desktop(inject.ui);
			};
		};

		$exports.user = {};
		if ($exports.HOME.getSubdirectory("Downloads")) $exports.user.downloads = $exports.HOME.getSubdirectory("Downloads");
		//	TODO	document that this is optional; that there are some environments where "working directory" makes little sense

		Object.defineProperty(
			$exports,
			"browser",
			{
				get: $api.fp.memoized(function() {
					return $loader.module("browser/module.js", {
						os: $exports.os,
						HOME: $exports.HOME,
						TMPDIR: $exports.TMPDIR,
						run: scripts.run_old.run,
						environment: environment,
						api: {
							js: $context.api.js,
							java: $context.api.java,
							file: $context.api.file,
							httpd: $context.api.httpd
						}
					});
				})
			}
		);

		$exports.system = {};
		Object.defineProperty(
			$exports.system,
			"apple",
			{
				get: $api.fp.memoized(function() {
					return $loader.file("apple.js", {
						api: {
							document: $context.api.document,
							js: $context.api.js,
							shell: x,
							xml: $context.api.xml
						}
					});
				})
			}
		)

		Object.defineProperty(
			$exports.system,
			"opendesktop",
			{
				get: $api.fp.memoized(function() {
					return $loader.file("opendesktop.js", {
						api: {
							js: $context.api.js,
							shell: $exports
						}
					});
				})
			}
		)

		var addPropertyArgumentsTo = function(jargs,properties) {
			if (properties) {
				for (var x in properties) {
					jargs.push("-D" + x + "=" + properties[x]);
				}
			}
		};

		$exports.java = Object.assign(
			function(p) {
				//	TODO	check for both p.classpath and p.jar being defined and decide what to do
				var launcher = $exports.java.launcher;
				var shell = {
					command: launcher
				};
				var args = [];
				var vmarguments = (p.vmarguments) ? p.vmarguments : [];
				if (p.properties) {
					addPropertyArgumentsTo(vmarguments,p.properties);
				}
				args.push.apply(args,vmarguments);
				for (var x in p) {
					if (x == "classpath") {
						args.push("-classpath", p[x]);
					} else if (x == "jar") {
						args.push("-jar", p[x]);
					} else if (x == "properties") {
						//	handled above
					} else {
						shell[x] = p[x];
					}
				}
				//	TODO	some way of specifying VM arguments
				if (!p.jar) {
					args.push(p.main);
				}
				shell.arguments = args.concat( (p.arguments) ? p.arguments : [] );
				return scripts.run_old.run(shell);
			},
			{
				version: void(0),
				keytool: void(0),
				launcher: void(0),
				jrunscript: void(0),
				home: void(0)
			}
		);
		(function() {
			this.version = properties.get("java.version");
			this.vendor = new function() {
				this.toString = function() {
					return properties.get("java.vendor");
				}

				this.url = properties.get("java.vendor.url");
			}
			this.home = properties.directory("java.home");

			var Vvn = function(prefix) {
				this.version = properties.get(prefix + "version");
				this.vendor = properties.get(prefix + "vendor");
				this.name = properties.get(prefix + "name");
			}

			this.vm = Object.assign(
				new Vvn("java.vm."),
				{
					specification: void(0)
				}
			);
			this.vm.specification = new Vvn("java.vm.specification.");
			this.specification = new Vvn("java.specification.");

			this["class"] = new function() {
				this.version = properties.get("java.class.version");
				if (properties.get("java.class.path")) this.path = properties.searchpath("java.class.path");
			}

			//	Convenience alias that omits keyword
			this.CLASSPATH = this["class"].path;

			this.library = new function() {
				this.path = properties.searchpath("java.library.path");
			}

			//	java.io.tmpdir really part of filesystem; see TMPDIR above

			//	Javadoc claims this to be always present but it is sometimes null; we leave it as undefined in that case, although this
			//	behavior is undocumented
			var compiler = properties.get("java.compiler");
			if (compiler) {
				this.compiler = compiler;
			}

			if (properties.get("java.ext.dirs")) this.ext = new function() {
				this.dirs = properties.searchpath("java.ext.dirs");
			}

			//	os.name, os.arch, os.version handled by $exports.os

			//	file.separator, path.separator, line.separator handled by filesystems in jsh.file

			//	user.name is $exports.USER
			//	user.home is $exports.HOME
			//	user.dir is $exports.PWD

			//	TODO	Document
			var self = this;

			Object.defineProperty(
				this, "launcher",
				{
					get: $api.fp.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin")]).getCommand("java");
					})
				}
			);
			// this.launcher = $context.api.file.Searchpath([this.home.getRelativePath("bin")]).getCommand("java");

			Object.defineProperty(
				this, "jrunscript",
				{
					get: $api.fp.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin"),self.home.getRelativePath("../bin")]).getCommand("jrunscript");
					})
				}
			);

			Object.defineProperty(
				this, "keytool",
				{
					get: $api.fp.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin")]).getCommand("keytool");
					})
				}
			);
		//	this.jrunscript = $context.api.file.Searchpath([this.home.getRelativePath("bin"),this.home.getRelativePath("../bin")]).getCommand("jrunscript");
		}).call($exports.java);

		$exports.jrunscript = function(p) {
			var launch = (function() {
				//	This argument serves mostly to allow the jsh launcher to specify the jrunscript to use, since in Graal
				//	shells the JDK's jrunscript does not work and we need to use the bootstrapping JDK
				if (p.jrunscript) return {
					command: p.jrunscript,
					arguments: [],
					vmArgumentPrefix: "-J"
				};
				if (false && $exports.rhino && $exports.rhino.classpath) {
					//	TODO	implicit jsh dependency, because rhino.classpath not set in this file
					return {
						command: $exports.java.launcher,
						arguments: [
							"-jar", $exports.rhino.classpath.pathnames[0],
							"-opt", "-1"
						],
						vmArgumentPrefix: ""
					};
				} else {
					if (!$exports.java.jrunscript) {
						var searchpath = $context.api.file.Searchpath([$exports.java.home.getRelativePath("bin"),$exports.java.home.getRelativePath("../bin")]);
						Packages.java.lang.System.err.println("path = " + searchpath);
						Packages.java.lang.System.err.println("path = " + searchpath.getCommand("jrunscript"));
						throw new Error("No jrunscript in " + $exports.java.home);
					}
					return {
						command: $exports.java.jrunscript,
						arguments: [],
						vmArgumentPrefix: "-J"
					}
				}
			})();

			var vmargs = [];

			addPropertyArgumentsTo(vmargs,p.properties);

			if (p.vmarguments) {
				for (var i=0; i<p.vmarguments.length; i++) {
					vmargs.push(launch.vmArgumentPrefix + p.vmarguments[i]);
				}
			}

			var args = vmargs.concat(launch.arguments).concat(p.arguments);

			return scripts.run_old.run($context.api.js.Object.set({}, p, {
				command: launch.command,
				arguments: args
			}));
		};

		if ($context.kotlin) $exports.kotlin = $api.events.Function(function(p,events) {
			//	TODO	remove script property
			var copy = $api.Object.properties(p).filter(function(property) {
				return property.name != "script";
			}).object();
			return scripts.run_old.$run(Object.assign({}, copy, {
				command: $context.kotlin.compiler,
				arguments: function(rv) {
					rv.push("-script", p.script);
					if (p.arguments) rv.push.apply(rv,p.arguments);
				}
			}), events);
		});

		/** @type { slime.jrunscript.shell.run.Parent } */
		var defaults = {
			directory: $exports.PWD.toString(),
			environment: environment,
			stdio: {
				output: $context.stdio.output,
				error: $context.stdio.error
			}
		}

		$exports.Invocation = invocation.exports(defaults);

		$exports.world = scripts.run;

		$exports.Tell = {
			exit: function() {
				return function(tell) {
					var rv;

					tell({
						exit: function(e) {
							rv = e.detail;
						}
					});

					return rv;
				};
			},
			mock: scripts.run.internal.mock.tell
		};

		$exports.environment = environment;

		var Parent_from_process = function() {
			return {
				environment: environment,
				stdio: {
					output: $context.stdio.output,
					error: $context.stdio.error
				},
				directory: properties.get("user.dir")
			}
		}

		/** @type { slime.jrunscript.shell.Exports } */
		var x = {
			subprocess: {
				Parent: {
					from: {
						process: Parent_from_process
					}
				},
				Invocation: scripts.run.exports.Invocation,
				action: function(p) {
					return scripts.run.exports.Invocation.action(
						scripts.run.exports.Invocation.from.intention(Parent_from_process())(p)
					);
				},
				question: function(p) {
					return scripts.run.exports.Invocation.question(
						scripts.run.exports.Invocation.from.intention(Parent_from_process())(p)
					);
				}
			},
			Intention: {},
			listeners: module.events.listeners,
			properties: properties,
			invocation: $exports.invocation,
			environment: $exports.environment,
			java: $exports.java,
			TMPDIR: $exports.TMPDIR,
			USER: $exports.USER,
			HOME: $exports.HOME,
			PWD: $exports.PWD,
			os: $exports.os,
			user: $exports.user,
			system: $exports.system,
			jrunscript: $exports.jrunscript,
			kotlin: $exports.kotlin,
			rhino: $exports.rhino,
			world: $exports.world,
			Invocation: $exports.Invocation,
			Tell: $exports.Tell,
			run: scripts.run_old.run,
			PATH: $exports.PATH,
			browser: $exports.browser,
			test: {
				invocation: invocation
			}
		}

		$export(x);
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
