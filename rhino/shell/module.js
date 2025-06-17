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
			events: $api.events.emitter()
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
			 * @returns { slime.jrunscript.shell.Exports["properties"] & { set: any } }
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
					set: function(name,value) {
						_properties.setProperty(name, value);
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
			run_old: $loader.script("run-old.js"),
			/** @type { slime.jrunscript.shell.internal.console.Script } */
			console: $loader.script("console.js"),
			/** @type { slime.jrunscript.shell.java.Script } */
			java: $loader.script("java.js"),
			/** @type { slime.jrunscript.shell.ssh.Script } */
			ssh: $loader.script("ssh.js")
		};

		var scripts = (function() {
			/** @type { slime.$api.fp.impure.Input<slime.jrunscript.shell.run.internal.Parent> } */
			var Parent_from_process = function() {
				return {
					environment: environment,
					stdio: {
						output: $context.stdio.output,
						error: $context.stdio.error
					},
					directory: properties.get("user.dir")
				}
			};

			var run = code.run({
				library: {
					java: $context.api.java,
					io: $context.api.io,
					file: $context.api.file
				},
				parent: Parent_from_process,
				world: $api.fp.now.map($context, $api.fp.optionalChain("world"), $api.fp.optionalChain("subprocess"))
			});

			return {
				run: run,
				run_old: code.run_old({
					api: {
						io: $context.api.io,
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
						run: run
					},
					stdio: $context.stdio
				})
			}
		})();

		$exports.invocation = scripts.run_old.invocation.invocation;

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

			var system = (
				function() {
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

					return system;
				}
			).call(this);

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

		$exports.system = $api.fp.now(
			{},
			$api.Object.defineProperty({
				name: "apple",
				descriptor: {
					get: $api.fp.impure.Input.memoized(function() {
						//	TODO	update type definitions for apple.js and use $loader.script
						/** @type { slime.jrunscript.shell.system.apple.Script } */
						var script = $loader.script("apple.js");
						var rv = $loader.file("apple.js", {
							api: {
								document: $context.api.document,
								js: $context.api.js,
								shell: x,
								xml: $context.api.xml
							}
						});
						return rv;
					})
				}
			}),
			$api.Object.defineProperty({
				name: "opendesktop",
				descriptor: {
					get: $api.fp.impure.Input.memoized(function() {
						/** @type { slime.jrunscript.shell.opendesktop.Script } */
						var script = $loader.script("opendesktop.js");
						return script({
							library: {
								js: $context.api.js,
								shell: {
									PATH: $exports.PATH,
									run: scripts.run_old.run
								}
							}
						});
					})
				}
			})
		);

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
				home: void(0),
				Jdk: code.java({
					home: function() { return properties.directory("java.home"); }
				}).Jdk
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
					get: $api.fp.impure.Input.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin")]).getCommand("java");
					})
				}
			);
			// this.launcher = $context.api.file.Searchpath([this.home.getRelativePath("bin")]).getCommand("java");

			Object.defineProperty(
				this, "jrunscript",
				{
					get: $api.fp.impure.Input.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin"),self.home.getRelativePath("../bin")]).getCommand("jrunscript");
					})
				}
			);

			Object.defineProperty(
				this, "keytool",
				{
					get: $api.fp.impure.Input.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin")]).getCommand("keytool");
					})
				}
			);
		//	this.jrunscript = $context.api.file.Searchpath([this.home.getRelativePath("bin"),this.home.getRelativePath("../bin")]).getCommand("jrunscript");
		}).call($exports.java);

		/** @type { slime.jrunscript.shell.Exports["jrunscript"] } */
		$exports.jrunscript = {
			old: function(p) {
				var launch = (function() {
					if (p.jrunscript) return {
						command: /** @type { slime.jrunscript.file.File } */(p.jrunscript),
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

				var nashornDeprecationArguments = (
					function() {
						//	TODO	for now we can't simplify this, because we might be using a custom jrunscript that is not even from
						//			the JDK we are invoking, due to Graal. But is this valid? Can it happen? Need to investigate.
						//
						//			Once we eliminate that situation, we can build a bootstrap method that executes this command for the
						//			appropriate jrunscript and returns the major version number in one step
						/** @type { slime.jrunscript.shell.run.Intention } */
						var versionIntention = {
							command: launch.command.pathname.toString(),
							arguments: $api.Array.build(function(rv) {
								rv.push("-e", "print(java.lang.System.getProperty(\"java.version\"))");
							}),
							stdio: {
								output: "string",
								error: "string"
							}
						};

						var it = $api.fp.world.Sensor.now({
							sensor: scripts.run.exports.subprocess.question,
							subject: versionIntention
						});

						var version = it.stdio.output.trim();

						var major = $context.api.bootstrap.java.versions.getMajorVersion.forJavaVersionProperty(version);

						return $context.api.bootstrap.nashorn.getDeprecationArguments(major);
					}
				)();

				vmargs.push.apply(vmargs, nashornDeprecationArguments);

				addPropertyArgumentsTo(vmargs,p.properties);

				if (p.vmarguments) {
					for (var i=0; i<p.vmarguments.length; i++) {
						vmargs.push(launch.vmArgumentPrefix + p.vmarguments[i]);
					}
				}

				var args = vmargs.concat(launch.arguments).concat(p.arguments.map(String));

				return scripts.run_old.run(
					$api.Object.compose(
						p,
						{
							command: launch.command,
							arguments: args
						}
					)
				);
			},
			Intention: {
				shell: function(j) {
					//	TODO	at one point we would check to see if Rhino was available and if so, invoke the Rhino executable
					//			JAR using Java instead of using jrunscript. That's been disabled for a while but we could consider
					//			bringing it back.
					//
					//			That's one of the reasons the VM arguments are split out; they need to be prefixed with `-J` in
					//			`jrunscript` but not for the `java` launcher.

					var jdk = (j.jdk) ? j.jdk : $exports.java.Jdk.from.javaHome();
					var jdkBase = $context.api.file.Location.from.os(jdk.base);
					var _jdkBase = $context.api.file.Location.java.File.simple(jdkBase);
					var jdkInstall = $context.api.bootstrap.java.Install(_jdkBase);
					var _jrunscript = jdkInstall.jrunscript;
					var jrunscript = $context.api.file.Location.from.java.File(_jrunscript);
					return {
						command: jrunscript.pathname,
						//	TODO	use .flat when available
						arguments: $api.Array.build(function(rv) {
							if (j.vmarguments) j.vmarguments.forEach(function(arg) { rv.push("-J" + arg ) });
							if (j.properties) {
								for (var x in j.properties) {
									rv.push("-D" + x + "=" + j.properties[x]);
								}
							}
							if (j.arguments) j.arguments.forEach(function(arg) { rv.push(arg); })
						}),
						environment: j.environment,
						directory: j.directory,
						stdio: j.stdio
					}
				}
			}
		};

		if ($context.kotlin) $exports.kotlin = $api.events.Function(function(p,events) {
			//	TODO	remove script property
			var copy = $api.Object.properties(p).filter(function(property) {
				return property.name != "script";
			}).object();
			return scripts.run_old.$run(Object.assign({}, copy, {
				command: $context.kotlin.compiler,
				arguments: $api.Array.build(function(rv) {
					rv.push("-script", p.script);
					if (p.arguments) rv.push.apply(rv,p.arguments);
				})
			}), events);
		});

		/** @type { slime.jrunscript.shell.run.internal.Parent } */
		var defaults = {
			directory: $exports.PWD.toString(),
			environment: environment,
			stdio: {
				output: $context.stdio.output,
				error: $context.stdio.error
			}
		}

		$exports.Invocation = scripts.run_old.invocation.exports(defaults);

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

		/** @type { slime.jrunscript.shell.Exports["Environment"] & { envArgs: slime.jrunscript.shell.internal.GetEnvArguments } } */
		var Environment = (
			function() {
				/** @type { slime.jrunscript.shell.Exports["Environment"]["is"]} */
				var is = {
					/** @type { slime.jrunscript.shell.Exports["Environment"]["is"]["standalone"] } */
					standalone: function(p) {
						return Boolean(p["only"]);
					},
					/** @type { slime.jrunscript.shell.Exports["Environment"]["is"]["inherited"] } */
					inherited: function(p) {
						return Boolean(p["set"]);
					}
				}

				/**
				 * @type { getEnvArgs }
				 */
				var getEnvArgs = function(environment) {
					var set = function(name,value) {
						return name + "=" + "\"" + value + "\"";
					};

					if (is.inherited(environment)) {
						return Object.entries(environment.set).reduce(function(rv,entry) {
							if (entry[1] === null) return ["-u", entry[0]].concat(rv);
							if (typeof(entry[1]) == "string") return rv.concat([set(entry[0],entry[1])]);
							if (typeof(entry[1]) == "undefined") return rv;
							throw new Error("Variable " + entry[0] + " has wrong type: " + typeof(entry[1]));
						},[]);
					} else {
						return ["-i"].concat(
							Object.entries(environment.only).reduce(function(rv,entry) {
								if (typeof(entry[1]) == "string") return rv.concat([set(entry[0],entry[1])]);
								if (typeof(entry[1]) == "undefined") return rv;
								throw new Error("Variable " + entry[0] + " has wrong type: " + typeof(entry[1]));
							},[])
						);
					}
				};

				return {
					is: is,
					run: function(p) {
						if (!p) return function(was) {
							return was;
						};
						if (is.inherited(p)) {
							return function(was) {
								return $api.Object.compose(was, p.set);
							}
						} else {
							return function(was) {
								return p.only;
							}
						}
					},
					envArgs: getEnvArgs
				}
			}
		)();

		var subprocess = scripts.run.exports.subprocess;

		var ssh = code.ssh({
			library: {
				getEnvArguments: Environment.envArgs
			},
			world: {
				subprocess: subprocess
			}
		});

		/** @type { slime.jrunscript.shell.Exports } */
		var x = {
			process: {
				directory: {
					get: function() {
						return properties.get("user.dir");
					},
					set: function(value) {
						properties.set("user.dir", value);
					}
				}
			},
			subprocess: subprocess,
			Environment: Environment,
			bash: (
				function() {
					return {
						from: {
							intention: function() {
								return function(p) {
									/** @type { string[] } */
									var script = [];
									script.push("#!/bin/bash");
									if (p.directory) script.push("cd " + p.directory);

									script.push($api.Array.build(function(rv) {
										/** @type { Parameters<ReturnType<slime.jrunscript.shell.Exports["bash"]["from"]["intention"]>>[0]["environment"]} */
										var environment = (p.environment) || { set: {} };

										var envArgs = Environment.envArgs(environment);
										if (envArgs) rv.push.apply(rv, ["env"].concat(envArgs));
										rv.push(p.command);
										if (p.arguments) rv.push.apply(rv, p.arguments);
									}).join(" "));

									return script.join("\n");
								}
							}
						},
						environment: environment,
						run: function(p) {
							return function(bash) {
								return {
									command: bash.command,
									arguments: bash.arguments,
									directory: bash.directory,
									environment: x.Environment.run(bash.environment),
									stdio: p.stdio
								}
							}
						}
					}
				}
			)(),
			ssh: ssh,
			Intention: {
				from: {}
			},
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
			Console: code.console({
				library: {
					file: $context.api.file
				}
			}),
			browser: void(0),
			inject: {
				httpd: function(module) {
					/** @type { slime.jrunscript.shell.browser.Script } */
					var script = $loader.script("browser/module.js");
					var exports = script({
						os: $exports.os,
						HOME: $exports.HOME,
						TMPDIR: $exports.TMPDIR,
						USER: $exports.USER,
						run: scripts.run_old.run,
						environment: environment,
						api: {
							java: $context.api.java,
							file: $context.api.file,
							httpd: module
						}
					});
					x.browser = exports;
				}
			},
			test: {
				invocation: scripts.run_old.invocation
			}
		}

		if (!x.PATH) throw new Error("No PATH.");
		if (!$exports.system.apple.plist) throw new Error("No plist.");
		$export(x);
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
