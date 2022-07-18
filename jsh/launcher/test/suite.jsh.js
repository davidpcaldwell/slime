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
	 * @param { slime.jsh.Global & { test: any } } jsh
	 */
	function(Packages,$api,jsh) {
		var code = {
			/** @type { slime.jsh.internal.launcher.test.Script } */
			script: jsh.script.loader.script("suite.js")
		};

		var library = {
			script: code.script({
				library: {
					shell: jsh.shell
				}
			})
		};

		/**
		 *
		 * @param { slime.jsh.internal.launcher.test.ShellConfiguration } configuration
		 * @returns { (verify: slime.definition.verify.Verify) => (result: slime.jsh.internal.launcher.test.Result) => void }
		 */
		function verifyOutput(configuration) {
			return function(verify) {
				return function(result) {
					if (configuration.isUnbuilt) {
						verify(result).src.is.not(null);
						verify(result).home.is(null);
					} else {
						verify(result).src.is(null);
						verify(result).home.is.not(null);
					}
					verify(result).logging.is("/foo/bar");
					verify(result).foo1.is("bar");
					verify(result).foo2.is("baz");
					verify(result).rhino.running.is( configuration.isRhino );
					if (configuration.hasRhino) {
						verify(result).rhino.classpath.is.not(null);
					} else {
						//	TODO	below comment seems wrong; the whole point of .hasRhino is that we do know, right?
						//	We do not know; we could have been run inside a shell that has Rhino installed
						//	verify(result).rhino.classpath.is(null);
					}
					verify(result).tmp.is(configuration.tmp.toString());
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.file.Pathname } rhino
		 * @param { slime.jrunscript.file.Pathname } specified The specified location of the built shell, if any.
		 * @param { slime.jrunscript.file.Directory } shell If running in a built shell, its location.
		 */
		var getHome = function(rhino,specified,shell) {
			if (specified && specified.directory) {
				jsh.shell.console("Launcher tests using supplied built shell at " + specified + " ...");
				return specified.directory;
			}
			if (shell) return shell;
			jsh.shell.console("Building shell in which to run launcher tests ...");
			var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
			$api.Function.world.now.action(
				library.script.buildShell(jsh.shell.jsh.src, rhino),
				tmpdir,
				{
					console: function(e) {
						jsh.shell.console(e.detail);
					}
				}
			);
			return tmpdir;
		}

		/**
		 *
		 * @param { slime.jsh.internal.launcher.test.ShellInvocation } p
		 * @returns
		 */
		var shell = function(p) {
			/** @type { slime.jrunscript.shell.invocation.Token[] } */
			var vm = [];
			if (p.vmarguments) vm.push.apply(vm,p.vmarguments);
			if (!p.bash) {
				if (p.logging) {
					p.properties["jsh.log.java.properties"] = p.logging;
				}
			}
			for (var x in p.properties) {
				vm.push("-D" + x + "=" + p.properties[x]);
			}
			var shell = (p.bash) ? p.shell : vm.concat(p.shell)
			var script = (p.script) ? p.script : jsh.script.file;
			var environment = $api.Object.compose(
				p.environment,
				(p.bash && p.logging) ? { JSH_LOG_JAVA_PROPERTIES: p.logging } : {},
				(jsh.shell.environment.JSH_SHELL_LIB) ? { JSH_SHELL_LIB: jsh.shell.environment.JSH_SHELL_LIB } : {}
			);
			return jsh.shell.run({
				command: (p.bash) ? p.bash : jsh.shell.java.jrunscript,
				arguments: shell.concat([script.toString()]).concat( (p.arguments) ? p.arguments : [] ),
				stdio: (p.stdio) ? p.stdio : {
					output: String
				},
				environment: environment,
				evaluate: (p.evaluate) ? p.evaluate : function(result) {
					if (p.bash) {
						jsh.shell.echo("Command: " + result.command + " " + result.arguments.join(" "));
					}
					if (result.status !== 0) throw new Error("Status is " + result.status);
					jsh.shell.echo("Output: " + result.stdio.output);
					return JSON.parse(result.stdio.output);
				}
			})
		};

		/**
		 *
		 * @param { slime.jsh.internal.launcher.test.ShellInvocation } invocation
		 * @param { slime.jsh.internal.launcher.test.ShellImplementation } implementation
		 * @returns
		 */
		var getShellResult = function(invocation,implementation) {
			/**
			 *
			 * @param { slime.jsh.internal.launcher.test.ShellInvocation } invocation
			 * @param { slime.jsh.internal.launcher.test.ShellImplementation } implementation
			 * @returns
			 */
			var toInvocation = function(invocation,implementation) {
				return $api.Object.compose(invocation, {
					shell: implementation.shell
				})
			};

			return shell(toInvocation(invocation, implementation));
		};

		/**
		 * @param { string } engine
		 * @param { slime.jsh.internal.launcher.test.ShellImplementation } shell
		 * @param { slime.jrunscript.file.Pathname } rhino
		 * @param { slime.jrunscript.file.Directory } home
		 * @param { slime.jrunscript.file.Directory } tmp
		 * @returns { slime.jsh.internal.launcher.test.Scenario }
		 */
		var toScenario = function(engine,shell,rhino,home,tmp) {
			var type = shell.type;

			var name = engine + " " + type;

			var execute = function(verify) {
				/** @type { { [name: string]: string } } */
				var properties = {};

				var environment = {
					PATH: jsh.shell.environment.PATH,
					//	TODO	below is used for Windows temporary files
					TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
					//	TODO	below is used for Windows command location
					PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
					JSH_JVM_OPTIONS: "-Dfoo.1=bar -Dfoo.2=baz",
					JSH_ENGINE_RHINO_CLASSPATH: (rhino) ? String(rhino) : null,
					JSH_ENGINE: engine,
					JSH_SHELL_TMPDIR: tmp.toString()
					//,JSH_LAUNCHER_DEBUG: "true"
					//,JSH_DEBUG_JDWP: (engine == "rhino" && shell == built) ? "transport=dt_socket,address=8000,server=y,suspend=y" : null
				};

				var result = getShellResult({
					logging: "/foo/bar",
					environment: environment,
					properties: properties
				}, shell);

				var checkOutput = verifyOutput({
					hasRhino: Boolean(rhino),
					isRhino: Boolean(engine == "rhino"),
					isUnbuilt: Boolean(type == "unbuilt"),
					tmp: tmp
				})(verify);

				checkOutput(result);

				if (type == "built" && jsh.shell.PATH.getCommand("bash")) {
					result = getShellResult({
						bash: jsh.shell.PATH.getCommand("bash").pathname,
						logging: "/foo/bar",
						environment: environment,
						properties: properties
					}, $api.Object.compose(
						shell,
						{
							shell: [home.getFile("jsh.bash")]
						}
					));
					checkOutput(result);
				}

				if (engine == "rhino") {
					var result = getShellResult({
						environment: {
							PATH: jsh.shell.environment.PATH,
							//	TODO	below is used for Windows temporary files
							TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
							//	TODO	below is used for Windows command location
							PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
							JSH_ENGINE_RHINO_CLASSPATH: String(rhino),
							JSH_ENGINE: "rhino",
							JSH_ENGINE_RHINO_OPTIMIZATION: String(0)
						}
					}, shell);
					verify(result).rhino.optimization.is(0);
				}
				if (engine == "nashorn" && rhino) {
					var result = getShellResult({
						environment: {
							PATH: jsh.shell.environment.PATH,
							//	TODO	below is used for Windows temporary files
							TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
							//	TODO	below is used for Windows command location
							PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
							JSH_ENGINE_RHINO_CLASSPATH: null,
							JSH_ENGINE: engine
						}
					}, shell);
					verify(result,"shell_without_rhino").rhino.running.is(false);
				}
			}

			return {
				name: name,
				execute: execute
			}
		}

		var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src : jsh.script.file.parent.parent.parent.parent;

		var engines = library.script.getEngines(src);

		jsh.loader.plugins(src.getRelativePath("jsh/test"));
		jsh.test.integration({
			getopts: {
				options: {
					rhino: jsh.file.Pathname,
					"shell:built": jsh.file.Pathname,
					//	TODO	unused
					"shell:unbuilt": jsh.file.Pathname
				}
			},
			scenario: function(parameters) {
				var home = getHome(parameters.options.rhino, parameters.options["shell:built"], jsh.shell.jsh.home);

				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

				/** @type { slime.jsh.internal.launcher.test.ShellImplementation } */
				var unbuilt = {
					type: "unbuilt",
					shell: [
						src.getRelativePath("rhino/jrunscript/api.js"),
						src.getRelativePath("jsh/launcher/main.js")
					],
					coffeescript: src.getFile("local/jsh/lib/coffee-script.js")
				};

				/** @type { slime.jsh.internal.launcher.test.ShellImplementation } */
				var built = {
					type: "built",
					shell: [
						home.getRelativePath("jsh.js")
					],
					coffeescript: home.getFile("lib/coffee-script.js")
				};

				var addScenario = (
					function() {
						var index = 0;
						return function(o) {
							this.scenario(String(++index), {
								create: function() {
									this.name = o.name;

									this.execute = function(scope,verify) {
										o.execute(verify);
									};
								}
							});
						}
					}
				)().bind(this);

				[unbuilt,built].forEach(function(implementation) {
					var shell = (unbuilt) ? home : src;
					var id = ["unbuilt","built"][arguments[1]];

					//	TODO	the below test does not pass under JDK 11; disabling it for later examination
					// this.scenario(id, jsh.test.Suite({
					// 	shell: shell,
					// 	script: jsh.script.file.parent.getFile("options.jsh.js")
					// }));

					//	The was already commented-out when the above comment was written

					// this.add({
					// 	scenario: new jsh.unit.Scenario.Integration({
					// 		shell: shell,
					// 		script: jsh.script.file.parent.getFile("options.jsh.js")
					// 	})
					// });
				},this);

				engines.forEach(function(engine) {
					var UNSUPPORTED = (this.engine == "rhino" && built.coffeescript);

					[unbuilt,built].forEach(function(shell) {
						var UNSUPPORTED = (engine == "rhino" && shell.coffeescript);
						if (!UNSUPPORTED) {
							addScenario(
								toScenario(
									engine,
									shell,
									parameters.options.rhino,
									home,
									tmp
								)
							);
						}
					});
				},this);
			},
			run: function(parameters) {
				var getProperty = function(name) {
					var rv = Packages.java.lang.System.getProperty(name);
					if (rv) return String(rv);
					return null;
				};

				var home = (jsh.shell.jsh.home) ? jsh.shell.jsh.home.toString() : null;
				var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src.toString() : null;
				var logging = getProperty("java.util.logging.config.file");
				var rhino = (function() {
					var rv = {
						running: (function() {
							if (typeof(Packages.org.mozilla.javascript.Context) != "function") return false;
							return Boolean(Packages.org.mozilla.javascript.Context.getCurrentContext());
						})()
					};
					rv.optimization = (rv.running) ? Number(Packages.org.mozilla.javascript.Context.getCurrentContext().getOptimizationLevel()) : null;
					rv.classpath = (jsh.shell.rhino && jsh.shell.rhino.classpath) ? String(jsh.shell.rhino.classpath) : null;
					return rv;
				})();
				jsh.shell.echo(
					JSON.stringify({
						src: src,
						home: home,
						logging: logging,
						foo1: getProperty("foo.1"),
						foo2: getProperty("foo.2"),
						tmp: String(jsh.shell.TMPDIR),
						rhino: rhino
					})
				);
			}
		});
	}
//@ts-ignore
)(Packages,$api,jsh);
