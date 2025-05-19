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
		//	TODO	this setup is a total mess, and the companion scenario.jsh.js it is running is duplicative with
		//			jrunscript/jsh/test/jsh-data.jsh.js

		var getJavascriptEngines = function(src) {
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

		/** @param { slime.jrunscript.file.Directory } src */
		var getUnbuiltEngineArguments = function(src) {
			return src.getFile("local/jsh/lib/nashorn.jar")
				? [
					"-classpath",
					[
						"asm", "asm-commons", "asm-tree", "asm-util", "nashorn"
					].map(function(name) {
						return src.getRelativePath("local/jsh/lib/" + name + ".jar").toString();
					}).join(":")
				]
				: []
		};

		var getBuiltEngineArguments = function(home) {
			return home.getFile("lib/nashorn.jar")
				? [
					"-classpath",
					[
						"asm", "asm-commons", "asm-tree", "asm-util", "nashorn"
					].map(function(name) {
						return home.getRelativePath("lib/" + name + ".jar").toString();
					}).join(":")
				]
				: []
			;
		}

		/**
		 *
		 * @param { slime.jrunscript.file.Directory } src
		 * @param { slime.jrunscript.file.Pathname } rhino A local location to find Rhino; if defined, this will be passed to the
		 * build process so that it does not have to download Rhino (which is what it will do by default).
		 * @returns { slime.$api.fp.world.Means<slime.jrunscript.file.Directory,{ console: string }> }
		 */
		var _buildShell = function(src,rhino) {
			return function(tmpdir) {
				return function(events) {
					var buildArguments = [];
					if (rhino) {
						buildArguments.push("-rhino", rhino.toString());
					}
					var engineArguments = getUnbuiltEngineArguments(src);
					$context.library.shell.run({
						command: $context.library.shell.java.jrunscript,
						arguments: engineArguments.concat([
							src.getRelativePath("rhino/jrunscript/api.js").toString(),
							"jsh",
							src.getRelativePath("jrunscript/jsh/etc/build.jsh.js").toString(),
							tmpdir.pathname.toString(),
							"-notest",
							"-nodoc"
						]).concat(buildArguments),
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
					//	TODO	the loader does not really define what happens in built and unbuilt shells with src, but it is
					//			defined here
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

		/** @type { slime.$api.fp.world.Sensor<slime.jsh.internal.launcher.test.BuiltShellContext,slime.jsh.internal.launcher.test.BuiltShellEvents,slime.jrunscript.file.Directory> } */
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
				$api.fp.world.now.action(
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

		/** @type { slime.$api.fp.world.Sensor<slime.jsh.internal.launcher.test.ShellInvocation,slime.jsh.internal.launcher.test.ShellInvocationEvents,slime.jsh.internal.launcher.test.Result> } */
		var shellResultQuestion = function(p) {
			if (p.shell && p.shell[0] === null) {
				debugger;
			}
			return function(events) {
				/** @type { slime.jrunscript.shell.invocation.old.Token[] } */
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
					//	TODO	considered passing the location of jrunscript directly but it might affect native launcher, which
					//			currently contains its own logic for locating jrunscript. So for now we pass this (somewhat
					//			inaccurately-named, since it might not really be JAVA_HOME) value
					{ JSH_JAVA_HOME: $context.library.shell.java.jrunscript.parent.parent.pathname.toString() },
					$api.Object.compose(
						(p.bash && p.logging) ? { JSH_LOG_JAVA_PROPERTIES: p.logging } : {},
						($context.library.shell.environment.JSH_SHELL_LIB) ? { JSH_SHELL_LIB: $context.library.shell.environment.JSH_SHELL_LIB } : {}
					)
				);
				var unbuilt = (function() {
					var pattern = /(.*)\/rhino\/jrunscript\/api\.js$/;
					var arg = shell.map(String).find(function(argument) {
						return pattern.test(String(argument));
					});
					return (arg) ? (pattern.exec(arg)[1]) : null;
				})();

				var built = (function() {
					var pattern = /(.*)\/jsh\.js$/;
					var arg = shell.map(String).find(function(argument) {
						return pattern.test(String(argument));
					});
					return (arg) ? (pattern.exec(arg)[1]) : null;
				})();

				var engineArguments = (function() {
					if (unbuilt) return getUnbuiltEngineArguments( $context.library.file.Pathname(unbuilt).directory );
					if (built) return getBuiltEngineArguments ( $context.library.file.Pathname(built).directory );
					return [];
				})();
				debugger;
				return $context.library.shell.run({
					command: (p.bash) ? p.bash : $context.library.shell.java.jrunscript,
					arguments: engineArguments.concat(shell.map(String)).concat([script.toString()]).concat( (p.arguments) ? p.arguments.map(String) : [] ),
					stdio: (p.stdio) ? p.stdio : {
						output: String
					},
					environment: environment,
					evaluate: (p.evaluate) ? p.evaluate : function(result) {
						if (p.bash) {
							events.fire("invocation", { command: String(result.command), arguments: result.arguments.map(String), environment: environment });
						}
						if (result.status !== 0) {
							throw new Error("Status is " + result.status);
						}
						events.fire("output", result.stdio.output);
						return JSON.parse(result.stdio.output);
					}
				});
			}
		};

		/** @type { (invocation: slime.jsh.internal.launcher.test.ShellInvocation) => slime.jsh.internal.launcher.test.Result } */
		var getShellResultFor = $api.fp.world.mapping(shellResultQuestion, {
			invocation: function(e) {
				//	TODO	can we use console for this and the next call?
				$context.console("Command: " + e.detail.command + " " + e.detail.arguments.join(" ") + " environment=" + JSON.stringify(e.detail.environment));
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
		 * @param { slime.jrunscript.file.Pathname } rhinoLocation Currently always undefined, but probably was to help with
		 * performance by making it possible not to download and install Rhino in Rhino shells?
		 * @param { slime.jrunscript.file.Directory } builtShell
		 * @param { slime.jrunscript.file.Directory } tmp
		 */
		var toScenario = function(rhinoLocation,builtShell,tmp) {
			//	TODO	this was used to locate RHino, apparently, in the old JSAPI version of the suite:
			//			var rhinoArgs = (jsh.shell.rhino) ? ["-rhino", jsh.shell.rhino.classpath.toString()] : [];

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
					//	TODO	copy-pasted from contributor/jrunscript-engine.jsh.js
					/**
					 * @param { string } implementationVersion
					 * @param { number } specified
					 */
					var expectedRhinoOptimizationLevel = function(implementationVersion,specified) {
						var parseRhinoVersion = $api.fp.pipe(
							$api.fp.RegExp.exec(/^Rhino (.*)/),
							$api.fp.Maybe.map(
								$api.fp.pipe(
									function(match) { return match[1]; },
									$api.fp.string.split("."),
									$api.fp.Array.map(Number)
								)
							)
						);

						if (specified == -1) return -1;
						var version = parseRhinoVersion(implementationVersion);
						if (version.present) {
							if (version.value[0] > 1) return 9;
							if (version.value[1] >= 8) return 9;
						}
						return specified;
					};

					return function(result) {
						return function(verify) {
							var expected = expectedRhinoOptimizationLevel(result.rhino.version,level);
							verify(result).rhino.optimization.is(expected);
						}
					}
				}

				var execute = function(verify) {
					var checks = $api.Array.build(
						/** @param { ((verify: slime.definition.verify.Verify) => void)[] } rv */
						function(rv) {
							rv.push(checkShellOutput(shellInvocation, implementation, descriptorChecks));
							if (implementation.type == "built" && bashInvocation) {
								//	TODO	it appears we use another entire launcher for built shells, in the source code at
								//			jsh/launcher/jsh.bash
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
					name: [engine, implementation.type],
					execute: execute
				}
			}
		};

		/** @type { (context: slime.jsh.internal.launcher.test.ShellContext) => slime.jrunscript.file.Directory } */
		var getContextSrc = function(context) {
			return (context.src) ? context.src : context.main.parent.parent.parent.parent;
		};

		/**
		 *
		 * @param { slime.jsh.internal.launcher.test.ShellContext } context
		 * @param { slime.jrunscript.file.Pathname } built
		 * @param { (message: string) => void } console
		 * @returns
		 */
		var getHome = function(context,built,console) {
			return $api.fp.world.now.question(
				requireBuiltShellHomeDirectory,
				$api.Object.compose(context, {
					specified: built
				}),
				{
					specified: function(e) {
						console("Using specified built shell at " + e.detail.toString());
					},
					current: function(e) {
						console("Using current built shell at " + e.detail.pathname.toString());
					},
					buildStart: function(e) {
						console("Building shell for tests ...");
					},
					buildLocation: function(e) {
						console("Building shell to " + e.detail.pathname.toString());
					},
					buildOutput: function(e) {
						console("BUILD OUTPUT: " + e.detail);
					}
				}
			);
		};

		/** @type { <T>(input: slime.$api.fp.impure.Input<T>) => slime.$api.fp.impure.Input<T> } */
		var memoized = function(input) {
			return $api.fp.impure.Input.memoized(input);
		}

		var getBuiltShellHomeDirectory = function(p) {
			return getHome(p.context, p.built, p.console);
		};

		var createTestSuite = (
			/**
			 *
			 * @param { slime.jsh.Global } jsh
			 * @param { { part: string, built: slime.jrunscript.file.Pathname } } options
			 * @param { slime.jsh.internal.launcher.test.SuiteRunner } runner
			 * @returns
			 */
			function(jsh,options,runner) {
				var getJsh = $api.fp.impure.Input.value(jsh);

				var Context = {
					src: getContextSrc,
					from: {
						jsh: function(jsh) {
							return {
								main: jsh.script.file,
								src: jsh.shell.jsh.src,
								home: jsh.shell.jsh.home
							};
						}
					}
				};

				var getContext = $api.fp.impure.Input.map(getJsh, Context.from.jsh);

				var getSrc = $api.fp.impure.Input.map(getContext, Context.src);

				var getEngines = memoized($api.fp.impure.Input.map(getSrc, getJavascriptEngines));

				var getUnbuilt = $api.fp.impure.Input.map(getSrc, function(src) {
					/** @type { slime.jsh.internal.launcher.test.ShellImplementation } */
					var unbuilt = {
						type: "unbuilt",
						shell: [
							src.getRelativePath("rhino/jrunscript/api.js"),
							src.getRelativePath("jrunscript/jsh/launcher/main.js")
						],
						coffeescript: src.getFile("local/jsh/lib/coffee-script.js")
					};
					return unbuilt;
				});

				/** @type { slime.$api.fp.impure.Input<slime.jrunscript.file.Directory> } */
				var getHome = memoized(function() {
					return getBuiltShellHomeDirectory({
						context: getContext(),
						built: options.built,
						console: jsh.shell.console
					});
				});

				var getBuilt = $api.fp.impure.Input.map(getHome, function(home) {
					/** @type { slime.jsh.internal.launcher.test.ShellImplementation } */
					var built = {
						type: "built",
						shell: [
							home.getRelativePath("jsh.js")
						],
						coffeescript: home.getFile("lib/coffee-script.js")
					};
					return built;
				})

				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

				var getShells = function() {
					return [getUnbuilt(), getBuilt()];
				}

				getEngines().forEach(function(engine) {
					getShells().forEach(function(shell) {
						var UNSUPPORTED = (engine == "rhino" && shell.coffeescript);
						if (!UNSUPPORTED) {
							runner.addScenario(
								toScenario(
									void(0),
									getHome(),
									tmp
								)(
									engine,
									shell
								)
							);
						}
					});
				},this);

				return {
					getSrc: getSrc
				}
			}
		);

		$export({
			createTestSuite: createTestSuite
		});
	}
//@ts-ignore
)($api,$context,$export);
