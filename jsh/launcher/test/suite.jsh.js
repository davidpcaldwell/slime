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
		/**
		 *
		 * @param { { rhino: boolean } } parameters
		 * @param { boolean } isRhino
		 * @param { boolean } isUnbuilt
		 * @param { slime.jrunscript.file.Directory } tmp
		 * @param { slime.definition.verify.Verify } verify
		 * @param { slime.internal.jsh.launcher.test.Result } result
		 */
		function verifyOutput(parameters,isRhino,isUnbuilt,tmp,verify,result) {
			if (isUnbuilt) {
				verify(result).src.is.not(null);
				verify(result).home.is(null);
			} else {
				verify(result).src.is(null);
				verify(result).home.is.not(null);
			}
			verify(result).logging.is("/foo/bar");
			verify(result).foo1.is("bar");
			verify(result).foo2.is("baz");
			verify(result).rhino.running.is( isRhino );
			if (parameters.rhino) {
				verify(result).rhino.classpath.is.not(null);
			} else {
				//	We do not know; we could have been run inside a shell that has Rhino installed
//							verify(result).rhino.classpath.is(null);
			}
			verify(result).tmp.is(tmp.toString());
		}

		/** @type { slime.$api.fp.world.Action<slime.jrunscript.file.Directory,{ console: string }> } */
		var buildShell = function(tmpdir) {
			return function(events) {
				var buildArguments = [];
				if (parameters.options.rhino) {
					buildArguments.push("-rhino", parameters.options.rhino);
				}
				jsh.shell.run({
					command: jsh.shell.java.jrunscript,
					arguments: [
						jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
						"jsh",
						jsh.shell.jsh.src.getRelativePath("jsh/etc/build.jsh.js"),
						tmpdir,
						"-notest",
						"-nodoc"
					].concat(buildArguments),
					environment: $api.Object.compose(
						{
							//	TODO	next two lines duplicate logic in jsh.test plugin
							TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
							PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
							PATH: jsh.shell.environment.PATH.toString()
						},
						(jsh.shell.environment.JSH_SHELL_LIB) ? { JSH_SHELL_LIB: jsh.shell.environment.JSH_SHELL_LIB } : {}
					)
				});
				events.fire("console", "Build successful.");
			}
		};

		var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src : jsh.script.file.parent.parent.parent.parent;
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
				/**
				 *
				 * @param { slime.jrunscript.file.Pathname } specified The location of the built shell.
				 * @param { slime.jrunscript.file.Directory } shell The directory of built shell in which we are running.
				 */
				var getHome = function(specified,shell) {
					if (specified && specified.directory) {
						jsh.shell.console("Launcher tests using supplied built shell at " + specified + " ...");
						return specified.directory;
					}
					if (shell) return shell;
					jsh.shell.console("Building shell in which to run launcher tests ...");
					var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					$api.Function.world.now.action(
						buildShell,
						tmpdir,
						{
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						}
					);
					return tmpdir;
				}

				var home = getHome(parameters.options["shell:built"], jsh.shell.jsh.home);

				var shell = function(p) {
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
					var shell = (p.bash) ? [home.getFile("jsh.bash").toString()] : vm.concat(p.shell)
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

				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

				var unbuilt = function(p) {
					return shell(jsh.js.Object.set({}, p, {
						shell: [
							src.getRelativePath("rhino/jrunscript/api.js"),
							src.getRelativePath("jsh/launcher/main.js")
						]
					}));
				};
				unbuilt.coffeescript = src.getFile("local/jsh/lib/coffee-script.js");

				var built = function(p) {
					//	TODO	could we use built shell if we are running in built shell?
					return shell(jsh.js.Object.set({}, p, {
						shell: [
							home.getRelativePath("jsh.js")
						]
					}));
				};
				built.coffeescript = home.getFile("lib/coffee-script.js");

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

				var engines = jsh.shell.run({
					command: "bash",
					arguments: [src.getFile("jsh.bash"), "-engines"],
					stdio: {
						output: String
					},
					evaluate: function(result) {
						return JSON.parse(result.stdio.output);
					}
				});

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
						if (!UNSUPPORTED) addScenario(new function() {
							var type = (shell == unbuilt) ? "unbuilt" : "built";
							this.name = engine + " " + type;

							this.execute = function(verify) {
								var properties = {};

								var environment = {
									PATH: jsh.shell.environment.PATH,
									//	TODO	below is used for Windows temporary files
									TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
									//	TODO	below is used for Windows command location
									PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
									JSH_JVM_OPTIONS: "-Dfoo.1=bar -Dfoo.2=baz",
									JSH_ENGINE_RHINO_CLASSPATH: (parameters.options.rhino) ? String(parameters.options.rhino) : null,
									JSH_ENGINE: engine,
									JSH_SHELL_TMPDIR: tmp.toString()
									//,JSH_LAUNCHER_DEBUG: "true"
									//,JSH_DEBUG_JDWP: (engine == "rhino" && shell == built) ? "transport=dt_socket,address=8000,server=y,suspend=y" : null
								};

								var result = shell({
									logging: "/foo/bar",
									environment: environment,
									properties: properties
								});

								var checkOutput = function(result) {
									verifyOutput(
										{ rhino: parameters.options.rhino },
										Boolean(engine == "rhino"),
										Boolean(shell == unbuilt),
										tmp,
										verify,
										result
									)
								};

								checkOutput(result);

								if (shell == built && jsh.shell.PATH.getCommand("bash")) {
									result = shell({
										bash: jsh.shell.PATH.getCommand("bash"),
										logging: "/foo/bar",
										environment: environment,
										properties: properties
									});
									checkOutput(result);
								}

								if (engine == "rhino") {
									var result = shell({
										environment: {
											PATH: jsh.shell.environment.PATH,
											//	TODO	below is used for Windows temporary files
											TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
											//	TODO	below is used for Windows command location
											PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
											JSH_ENGINE_RHINO_CLASSPATH: String(parameters.options.rhino),
											JSH_ENGINE: "rhino",
											JSH_ENGINE_RHINO_OPTIMIZATION: 0
										}
									});
									verify(result).rhino.optimization.is(0);
								}
								if (engine == "nashorn" && parameters.options.rhino) {
									var result = shell({
										environment: {
											PATH: jsh.shell.environment.PATH,
											//	TODO	below is used for Windows temporary files
											TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
											//	TODO	below is used for Windows command location
											PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
											JSH_ENGINE_RHINO_CLASSPATH: null,
											JSH_ENGINE: engine
										}
									});
									verify(result,"shell_without_rhino").rhino.running.is(false);
								}
							}
						});
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
