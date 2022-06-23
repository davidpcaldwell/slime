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
	 * @param { slime.jrunscript.shell.Exports } $exports
	 */
	function(Packages,$api,$context,$loader,$exports) {
		if (!$context.api.io) {
			throw new Error("Missing: $context.api.io");
		}

		var toLocalPathname = function(osPathname) {
			var _rv = osPathname.java.adapt();
			return $context.api.file.filesystem.java.adapt(_rv);
		}

		var toLocalSearchpath = function(searchpath) {
			return $context.api.file.Searchpath($context.api.file.filesystems.os.Searchpath.parse(searchpath).pathnames.map(toLocalPathname));
		};

		var module = {
			events: $api.Events({ source: $exports })
		};

		$exports.environment = $context.api.java.Environment( ($context._environment) ? $context._environment : Packages.inonit.system.OperatingSystem.Environment.SYSTEM );

		$exports.properties = (
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

		$api.experimental($exports.properties,"object");

		$exports.TMPDIR = $exports.properties.directory("java.io.tmpdir");
		$exports.USER = $exports.properties.get("user.name");
		$exports.HOME = $exports.properties.directory("user.home");
		if ($exports.properties.get("user.dir")) {
			$exports.PWD = $exports.properties.directory("user.dir");
		}
		if ($exports.environment.PATH) {
			$exports.PATH = toLocalSearchpath($exports.environment.PATH);
		} else if ($exports.environment.Path) {
			//	Windows
			$exports.PATH = toLocalSearchpath($exports.environment.Path);
		} else {
			$exports.PATH = $context.api.file.Searchpath([]);
		}

		var code = {
			/** @type { slime.jrunscript.shell.internal.run.Script } */
			run: $loader.script("run.js"),
			/** @type { slime.jrunscript.shell.internal.run.old.Script } */
			run_old: $loader.script("run-old.js"),
			/** @type { slime.jrunscript.shell.internal.invocation.Script } */
			invocation: $loader.script("invocation.js")
		};

		var scripts = (function() {
			var run = code.run({
				api: {
					java: $context.api.java,
					io: $context.api.io,
					file: $context.api.file
				}
			});
			var invocation = code.invocation({
				library: {
					io: $context.api.io
				},
				run: run
			});
			return {
				run: run,
				run_old: code.run_old({
					api: {
						file: $context.api.file
					},
					environment: $exports.environment,
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
				}),
				invocation: invocation
			}
		})();

		$exports.run = scripts.run_old.run;

		$exports.invocation = scripts.invocation.invocation;

		$exports.listeners = module.events.listeners;

		$exports.sudo = function(settings) {
			return {
				run: function(invocation) {
					var toRun = $exports.invocation.sudo(settings)($exports.Invocation.old(invocation));
					return $exports.run(toRun);
				}
			}
		};

		var embed = $api.Events.Function(
			/**
			 * @param { { method: Function, argument: object, started: (p: { output?: string, error?: string }) => boolean } } p
			 */
			function(p,events) {
				var ServerMonitor = function(started) {
					return function(events) {
						return {
							output: {
								line: function(line) {
									events.fire("stdout", line);
									if (started({ output: line })) events.fire("started");
								}
							},
							error: {
								line: function(line) {
									events.fire("stderr", line);
									if (started({ error: line })) events.fire("started");
								}
							}
						}
					}
				};

				p.method(
					$api.Object.compose(p.argument, { stdio: ServerMonitor(p.started)(events) })
				);
			}
		);

		$exports.embed = $api.Events.Function(function(p,events) {
			var lock = new $context.api.java.Thread.Monitor();
			var started = false;
			events.listeners.add("started", new lock.Waiter({
				then: function() {
					started = true;
				}
			}));
			$context.api.java.Thread.start(function() {
				try {
					embed(p, events);
				} catch (e) {
					events.fire("exception", e);
				}
			});
			new lock.Waiter({
				until: function() {
					return started;
				}
			})();
		});

		$exports.os = new function() {
			this.name = $exports.properties.get("os.name");
			this.arch = $exports.properties.get("os.arch");
			this.version = $exports.properties.get("os.version");
			this.newline = $exports.properties.get("line.separator");

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
				run: $exports.run,
				environment: $exports.environment,
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
				get: $api.Function.memoized(function() {
					return $loader.module("browser/module.js", {
						os: $exports.os,
						HOME: $exports.HOME,
						TMPDIR: $exports.TMPDIR,
						run: $exports.run,
						environment: $exports.environment,
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
				get: $api.Function.memoized(function() {
					return $loader.file("apple.js", {
						api: {
							document: $context.api.document,
							js: $context.api.js,
							shell: $exports,
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
				get: $api.Function.memoized(function() {
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
				return $exports.run(shell);
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
			this.version = $exports.properties.get("java.version");
			this.vendor = new function() {
				this.toString = function() {
					return $exports.properties.get("java.vendor");
				}

				this.url = $exports.properties.get("java.vendor.url");
			}
			this.home = $exports.properties.directory("java.home");

			var Vvn = function(prefix) {
				this.version = $exports.properties.get(prefix + "version");
				this.vendor = $exports.properties.get(prefix + "vendor");
				this.name = $exports.properties.get(prefix + "name");
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
				this.version = $exports.properties.get("java.class.version");
				if ($exports.properties.get("java.class.path")) this.path = $exports.properties.searchpath("java.class.path");
			}

			//	Convenience alias that omits keyword
			this.CLASSPATH = this["class"].path;

			this.library = new function() {
				this.path = $exports.properties.searchpath("java.library.path");
			}

			//	java.io.tmpdir really part of filesystem; see TMPDIR above

			//	Javadoc claims this to be always present but it is sometimes null; we leave it as undefined in that case, although this
			//	behavior is undocumented
			var compiler = $exports.properties.get("java.compiler");
			if (compiler) {
				this.compiler = compiler;
			}

			if ($exports.properties.get("java.ext.dirs")) this.ext = new function() {
				this.dirs = $exports.properties.searchpath("java.ext.dirs");
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
					get: $api.Function.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin")]).getCommand("java");
					})
				}
			);
			// this.launcher = $context.api.file.Searchpath([this.home.getRelativePath("bin")]).getCommand("java");

			Object.defineProperty(
				this, "jrunscript",
				{
					get: $api.Function.memoized(function() {
						return $context.api.file.Searchpath([self.home.getRelativePath("bin"),self.home.getRelativePath("../bin")]).getCommand("jrunscript");
					})
				}
			);

			Object.defineProperty(
				this, "keytool",
				{
					get: $api.Function.memoized(function() {
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

			return $exports.run($context.api.js.Object.set({}, p, {
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

		var Invocation_old = function(p) {
			return {
				command: String(p.command),
				arguments: (p.arguments) ? p.arguments.map(String) : [],
				environment: (p.environment) ? p.environment : $exports.environment,
				stdio: $api.Object.compose({
					input: null,
					output: $context.stdio.output,
					error: $context.stdio.error
				}, p.stdio),
				directory: (p.directory) ? p.directory : $exports.PWD
			};
		};

		$exports.world = {
			run: scripts.run.run,
			question: scripts.run.question,
			mock: scripts.run.mock.run,
			Invocation: $api.deprecate(Invocation_old)
		}

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
			mock: scripts.run.mock.tell
		}

		$exports.Invocation = {
			old: Invocation_old,
			modernize: scripts.invocation.modernize,
			sudo: scripts.invocation.sudo,
			create: function(p) {
				return {
					context: {
						environment: (p.environment) ? p.environment : $exports.environment,
						directory: (p.directory) ? p.directory.toString() : $exports.PWD.toString(),
						stdio: {
							input: (function() {
								if (p.stdio && p.stdio.input) return scripts.invocation.toInputStream(p.stdio.input);
								return null;
							})(),
							output: (p.stdio && p.stdio.output) ? p.stdio.output : $context.stdio.output,
							error: (p.stdio && p.stdio.error) ? p.stdio.error : $context.stdio.error,
						}
					},
					configuration: {
						command: String(p.command),
						arguments: (p.arguments) ? p.arguments.map(String) : []
					}
				}
			},
			stdio: {
				handler: {
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
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$exports);
