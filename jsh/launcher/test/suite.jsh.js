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
				},
				script: jsh.script.file,
				console: jsh.shell.console
			})
		};

		/**
		 * @param { slime.jrunscript.file.Pathname } rhinoLocation
		 * @param { slime.jrunscript.file.Directory } builtShell
		 * @param { slime.jrunscript.file.Directory } tmp
		 */
		var toScenario = function(rhinoLocation,builtShell,tmp) {
			var baseEnvironment = {
				PATH: jsh.shell.environment.PATH,
				//	TODO	below is used for Windows temporary files
				TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
				//	TODO	below is used for Windows command location
				PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
				JSH_JVM_OPTIONS: "-Dfoo.1=bar -Dfoo.2=baz",
				JSH_ENGINE_RHINO_CLASSPATH: (rhinoLocation) ? String(rhinoLocation) : null,
				JSH_SHELL_TMPDIR: tmp.toString()
			};
			/**
			 * @param { string } engine
			 * @param { slime.jsh.internal.launcher.test.ShellImplementation } shell
			 * @returns { slime.jsh.internal.launcher.test.Scenario }
			 */
			return function(engine,shell) {
				var name = engine + " " + shell.type;

				/** @type { { [name: string]: string } } */
				var properties = {};

				var environment = $api.Object.compose(baseEnvironment, {
					JSH_ENGINE: engine,
					//,JSH_LAUNCHER_DEBUG: "true"
					//,JSH_DEBUG_JDWP: (engine == "rhino" && shell == built) ? "transport=dt_socket,address=8000,server=y,suspend=y" : null
				});

				/** @type { slime.jsh.internal.launcher.test.ShellInvocation } */
				var shellInvocation = {
					logging: "/foo/bar",
					environment: environment,
					properties: properties
				};

				/** @type { slime.jsh.internal.launcher.test.ShellInvocation } */
				var bashInvocation = (jsh.shell.PATH.getCommand("bash")) ? {
					bash: jsh.shell.PATH.getCommand("bash").pathname,
					logging: "/foo/bar",
					environment: environment,
					properties: properties
				} : void(0);

				/** @type { slime.jsh.internal.launcher.test.ShellDescriptor } */
				var shellDescriptor = {
					hasRhino: Boolean(rhinoLocation),
					isRhino: Boolean(engine == "rhino"),
					isUnbuilt: Boolean(shell.type == "unbuilt"),
					tmp: tmp
				};

				var checkResultUsing = library.script.verifyOutput(shellDescriptor)

				var execute = function(verify) {
					var checkResult = checkResultUsing(verify);

					var result = library.script.getShellResult(shellInvocation, shell);

					checkResult(result);

					if (shell.type == "built" && bashInvocation) {
						result = library.script.getShellResult(bashInvocation, $api.Object.compose(
							shell,
							{
								shell: [builtShell.getFile("jsh.bash")]
							}
						));
						checkResult(result);
					}

					if (engine == "rhino") {
						var result = library.script.getShellResult({
							environment: $api.Object.compose(environment, {
								JSH_ENGINE_RHINO_OPTIMIZATION: String(0)
							})
						}, shell);
						verify(result).rhino.optimization.is(0);
					}

					if (engine == "nashorn" && rhinoLocation) {
						var result = library.script.getShellResult({
							environment: $api.Object.compose(environment, {
								JSH_ENGINE_RHINO_CLASSPATH: null
							})
						}, shell);
						verify(result,"shell_without_rhino").rhino.running.is(false);
					}
				}

				return {
					name: name,
					execute: execute
				}
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
				var context = {
					src: jsh.shell.jsh.src,
					rhino: parameters.options.rhino,
					specified: parameters.options["shell:built"],
					current: jsh.shell.jsh.home
				};

				var home = $api.Function.world.now.question(
					library.script.requireBuiltShell,
					context,
					{
						specified: function(e) {
							jsh.shell.console("Using specified built shell at " + e.detail.toString());
						},
						current: function(e) {
							jsh.shell.console("Using current built shell at " + e.detail.pathname.toString());
						},
						buildStart: function(e) {
							jsh.shell.console("Building shell for tests ...");
						},
						buildLocation: function(e) {
							jsh.shell.console("Building shell to " + e.detail.pathname.toString());
						},
						buildOutput: function(e) {
							jsh.shell.console("BUILD OUTPUT: " + e.detail);
						}
					}
				);

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
									parameters.options.rhino,
									home,
									tmp
								)(
									engine,
									shell
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
