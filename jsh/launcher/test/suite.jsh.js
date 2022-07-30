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

		/** @type { <T>(input: slime.$api.fp.impure.Input<T>) => slime.$api.fp.impure.Input<T> } */
		var memoized = function(input) {
			return $api.Function.memoized(input);
		}

		var getJsh = $api.Function.impure.Input.value(jsh);

		var getContext = $api.Function.impure.Input.map(getJsh, library.script.Context.from.jsh);

		var getSrc = $api.Function.impure.Input.map(getContext, library.script.Context.src);

		var getEngines = memoized($api.Function.impure.Input.map(getSrc, library.script.getEngines));

		var getUnbuilt = $api.Function.impure.Input.map(getSrc, function(src) {
			/** @type { slime.jsh.internal.launcher.test.ShellImplementation } */
			var unbuilt = {
				type: "unbuilt",
				shell: [
					src.getRelativePath("rhino/jrunscript/api.js"),
					src.getRelativePath("jsh/launcher/main.js")
				],
				coffeescript: src.getFile("local/jsh/lib/coffee-script.js")
			};
			return unbuilt;
		});

		jsh.loader.plugins(getSrc().getRelativePath("jsh/test"));
		jsh.test.integration({
			getopts: {
				options: {
					"shell:built": jsh.file.Pathname,
				}
			},
			scenario: function(parameters) {
				var home = library.script.getBuiltShellHomeDirectory({
					context: getContext(),
					built: parameters.options["shell:built"],
					console: jsh.shell.console
				});

				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

				var unbuilt = getUnbuilt();

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
					var shell = (unbuilt) ? home : getSrc();
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

				getEngines().forEach(function(engine) {
					[unbuilt,built].forEach(function(shell) {
						var UNSUPPORTED = (engine == "rhino" && shell.coffeescript);
						if (!UNSUPPORTED) {
							addScenario(
								library.script.toScenario(
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
