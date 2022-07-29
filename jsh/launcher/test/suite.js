//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.internal.launcher.test.Context } $context
	 * @param { slime.loader.Export<slime.jsh.internal.launcher.test.Exports> } $export
	 */
	function($api,$context,$export) {
		var getEngines = function(src) {
			var engines = $context.library.shell.run({
				command: "bash",
				arguments: [src.getFile("jsh.bash"), "-engines"],
				stdio: {
					output: String
				},
				evaluate: function(result) {
					return JSON.parse(result.stdio.output);
				}
			});
			return engines;
		}

		/**
		 *
		 * @param { slime.jrunscript.file.Directory } src
		 * @param { slime.jrunscript.file.Pathname } rhino A local location to find Rhino; if defined, this will be passed to the
		 * build process so that it does not have to download Rhino (which is what it will do by default).
		 * @returns { slime.$api.fp.world.Action<slime.jrunscript.file.Directory,{ console: string }> }
		 */
		var _buildShell = function(src,rhino) {
			return function(tmpdir) {
				return function(events) {
					var buildArguments = [];
					if (rhino) {
						buildArguments.push("-rhino", rhino);
					}
					$context.library.shell.run({
						command: $context.library.shell.java.jrunscript,
						arguments: [
							src.getRelativePath("rhino/jrunscript/api.js"),
							"jsh",
							src.getRelativePath("jsh/etc/build.jsh.js"),
							tmpdir,
							"-notest",
							"-nodoc"
						].concat(buildArguments),
						environment: $api.Object.compose(
							{
								//	TODO	next two lines duplicate logic in jsh.test plugin
								TEMP: ($context.library.shell.environment.TEMP) ? $context.library.shell.environment.TEMP : "",
								PATHEXT: ($context.library.shell.environment.PATHEXT) ? $context.library.shell.environment.PATHEXT : "",
								PATH: $context.library.shell.environment.PATH.toString()
							},
							($context.library.shell.environment.JSH_SHELL_LIB) ? { JSH_SHELL_LIB: $context.library.shell.environment.JSH_SHELL_LIB } : {}
						)
					});
					events.fire("console", "Build successful.");
				}
			}
		}

		/** @type { (configuration: slime.jsh.internal.launcher.test.ShellDescriptor) => slime.jsh.internal.launcher.test.Checks } */
		function checksForDescriptor(configuration) {
			return function(result) {
				return function(verify) {
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

		/** @type { slime.jsh.internal.launcher.test.Exports["requireBuiltShellHomeDirectory"] } */
		var requireBuiltShellHomeDirectory = function(p) {
			return function(events) {
				if (p.specified && p.specified.directory) {
					events.fire("specified", p.specified);
					return p.specified.directory;
				}
				if (p.home) {
					events.fire("current", p.home);
					return p.home;
				}
				events.fire("buildStart");
				var tmpdir = $context.library.shell.TMPDIR.createTemporary({ directory: true });
				events.fire("buildLocation", tmpdir);
				$api.Function.world.now.action(
					_buildShell(p.src, void(0)),
					tmpdir,
					{
						//	TODO	Probably need to come up with event forwarding API
						console: function(e) {
							events.fire("buildOutput", e.detail);
						}
					}
				);
				return tmpdir;
			}
		};

		/** @type { slime.$api.fp.world.Question<slime.jsh.internal.launcher.test.ShellInvocation,slime.jsh.internal.launcher.test.ShellInvocationEvents,slime.jsh.internal.launcher.test.Result> } */
		var shellResultQuestion = function(p) {
			return function(events) {
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
				var script = (p.script) ? p.script : $context.script;
				var environment = $api.Object.compose(
					p.environment,
					(p.bash && p.logging) ? { JSH_LOG_JAVA_PROPERTIES: p.logging } : {},
					($context.library.shell.environment.JSH_SHELL_LIB) ? { JSH_SHELL_LIB: $context.library.shell.environment.JSH_SHELL_LIB } : {}
				);
				return $context.library.shell.run({
					command: (p.bash) ? p.bash : $context.library.shell.java.jrunscript,
					arguments: shell.concat([script.toString()]).concat( (p.arguments) ? p.arguments : [] ),
					stdio: (p.stdio) ? p.stdio : {
						output: String
					},
					environment: environment,
					evaluate: (p.evaluate) ? p.evaluate : function(result) {
						if (p.bash) {
							events.fire("invocation", { command: result.command, arguments: result.arguments, environment: environment });
						}
						if (result.status !== 0) throw new Error("Status is " + result.status);
						events.fire("output", result.stdio.output);
						return JSON.parse(result.stdio.output);
					}
				});
			}
		};

		/** @type { (invocation: slime.jsh.internal.launcher.test.ShellInvocation) => slime.jsh.internal.launcher.test.Result } */
		var getShellResultFor = $api.Function.world.question(shellResultQuestion, {
			invocation: function(e) {
				//	TODO	can we use console for this and the next call?
				$context.console("Command: " + e.detail.command + " " + e.detail.arguments.join(" "));
			},
			output: function(e) {
				$context.console("Output: " + e.detail);
			}
		});

		/** @type { (invocation: slime.jsh.internal.launcher.test.ShellInvocation, implementation: slime.jsh.internal.launcher.test.ShellImplementation) => slime.jsh.internal.launcher.test.Result } */
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

			return getShellResultFor(toInvocation(invocation, implementation));
		}

		/**
		 * @param { slime.jrunscript.file.Pathname } rhinoLocation
		 * @param { slime.jrunscript.file.Directory } builtShell
		 * @param { slime.jrunscript.file.Directory } tmp
		 */
		var toScenario = function(rhinoLocation,builtShell,tmp) {
			var baseEnvironment = {
				PATH: $context.library.shell.environment.PATH,
				//	TODO	below is used for Windows temporary files
				TEMP: ($context.library.shell.environment.TEMP) ? $context.library.shell.environment.TEMP : "",
				//	TODO	below is used for Windows command location
				PATHEXT: ($context.library.shell.environment.PATHEXT) ? $context.library.shell.environment.PATHEXT : "",
				JSH_JVM_OPTIONS: "-Dfoo.1=bar -Dfoo.2=baz",
				JSH_ENGINE_RHINO_CLASSPATH: (rhinoLocation) ? String(rhinoLocation) : null,
				JSH_SHELL_TMPDIR: tmp.toString()
			};
			/**
			 * @param { string } engine
			 * @param { slime.jsh.internal.launcher.test.ShellImplementation } implementation
			 * @returns { slime.jsh.internal.launcher.test.Scenario }
			 */
			return function(engine,implementation) {
				var name = engine + " " + implementation.type;

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
				var bashInvocation = ($context.library.shell.PATH.getCommand("bash")) ? {
					bash: $context.library.shell.PATH.getCommand("bash").pathname,
					logging: "/foo/bar",
					environment: environment,
					properties: properties
				} : void(0);

				/** @type { slime.jsh.internal.launcher.test.ShellDescriptor } */
				var shellDescriptor = {
					hasRhino: Boolean(rhinoLocation),
					isRhino: Boolean(engine == "rhino"),
					isUnbuilt: Boolean(implementation.type == "unbuilt"),
					tmp: tmp
				};

				var descriptorChecks = checksForDescriptor(shellDescriptor);

				/**
				 *
				 * @param { slime.jsh.internal.launcher.test.ShellInvocation } invocation
				 * @param { slime.jsh.internal.launcher.test.ShellImplementation } implementation
				 * @param { slime.jsh.internal.launcher.test.Checks } checks
				 */
				var checkShellOutput = function(invocation, implementation, checks) {
					var result = getShellResult(invocation, implementation);
					return function(verify) {
						checks(result)(verify);
					}
				}

				/** @type { slime.jsh.internal.launcher.test.Checks } */
				var checkRhinoNotRunning = function(result) {
					return function(verify) {
						verify(result,"shell_without_rhino").rhino.running.is(false);
					}
				};

				/** @type { (level: number) => slime.jsh.internal.launcher.test.Checks } */
				var checkRhinoOptimizationIs = function(level) {
					return function(result) {
						return function(verify) {
							verify(result).rhino.optimization.is(level);
						}
					}
				}

				var execute = function(verify) {
					var checks = $api.Array.build(
						/** @param { ((verify: slime.definition.verify.Verify) => void)[] } rv */
						function(rv) {
							rv.push(checkShellOutput(shellInvocation, implementation, descriptorChecks));
							if (implementation.type == "built" && bashInvocation) {
								rv.push(
									checkShellOutput(
										bashInvocation,
										$api.Object.compose(
											implementation,
											{
												shell: [builtShell.getFile("jsh.bash")]
											}
										),
										descriptorChecks
									)
								);
							}
							if (engine == "rhino") {
								rv.push(
									checkShellOutput(
										{
											environment: $api.Object.compose(environment, {
												JSH_ENGINE_RHINO_OPTIMIZATION: String(0)
											})
										},
										implementation,
										checkRhinoOptimizationIs(0)
									)
								);
							}
							if (engine == "nashorn" && rhinoLocation) {
								rv.push(
									checkShellOutput(
										{
											environment: $api.Object.compose(environment, {
												JSH_ENGINE_RHINO_CLASSPATH: null
											})
										},
										implementation,
										checkRhinoNotRunning
									)
								);
							}
						}
					);

					checks.forEach(function(check) {
						check(verify);
					});
				}

				return {
					name: name,
					execute: execute
				}
			}
		}

		$export({
			getEngines: getEngines,
			requireBuiltShellHomeDirectory: requireBuiltShellHomeDirectory,
			toScenario: toScenario
		});
	}
//@ts-ignore
)($api,$context,$export);
