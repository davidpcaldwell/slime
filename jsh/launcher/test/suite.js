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
		 * @param { slime.jrunscript.file.Pathname } rhino
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

		/** @type { slime.jsh.internal.launcher.test.Exports["verifyOutput"] } */
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

		/** @type { slime.jsh.internal.launcher.test.Exports["requireBuiltShell"] } */
		var requireHomeDirectory = function(p) {
			return function(events) {
				if (p.specified && p.specified.directory) {
					events.fire("specified", p.specified);
					return p.specified.directory;
				}
				if (p.current) {
					events.fire("current", p.current);
					return p.current;
				}
				events.fire("buildStart");
				var tmpdir = $context.library.shell.TMPDIR.createTemporary({ directory: true });
				events.fire("buildLocation", tmpdir);
				$api.Function.world.now.action(
					_buildShell(p.src, p.rhino),
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

		/** @type { slime.jsh.internal.launcher.test.Exports["getShellResult"] } */
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

		$export({
			getEngines: getEngines,
			buildShell: _buildShell,
			verifyOutput: verifyOutput,
			requireBuiltShell: requireHomeDirectory,
			getShellResult: getShellResult
		});
	}
//@ts-ignore
)($api,$context,$export);
