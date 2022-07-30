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
				script: jsh.script.file.parent.getFile("scenario.jsh.js"),
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

		/** @type { slime.$api.fp.impure.Input<{ part: string, view: string, "shell:built": slime.jrunscript.file.Pathname }> } */
		var getOptions = function() {
			var parameters = jsh.script.getopts({
				options: {
					part: String,
					view: "console",
					"shell:built": jsh.file.Pathname
				}
			});
			return parameters.options;
		}

		var createTestSuite = (
			/**
			 *
			 * @param { slime.jsh.internal.launcher.test.SuiteRunner } runner
			 * @returns
			 */
			function(runner) {
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

				/** @type { slime.$api.fp.impure.Input<slime.jrunscript.file.Directory> } */
				var getHome = memoized(function() {
					return library.script.getBuiltShellHomeDirectory({
						context: getContext(),
						built: getOptions()["shell:built"],
						console: jsh.shell.console
					});
				});

				var getBuilt = $api.Function.impure.Input.map(getHome, function(home) {
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
								library.script.toScenario(
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
					getSrc: getSrc,
					/** @type { () => void } */
					run: function() {
						runner.run(getOptions().part);
					}
				}
			}
		);

		/**
		 *
		 * @param { string } suiteName
		 * @returns { slime.jsh.internal.launcher.test.SuiteRunner }
		 */
		var Runner = function(suiteName) {
			var suite = new jsh.unit.Suite({
				name: suiteName
			});

			var addScenario = (
				function() {
					var index = 0;
					return function(o) {
						suite.scenario(String(++index), {
							create: function() {
								this.name = o.name;

								this.execute = function(scope,verify) {
									o.execute(verify);
								};
							}
						});
					}
				}
			)();

			function run(part) {
				//	TODO	terser way to do this? I guess this is Maybe.map
				var path = (part) ? part.split("/") : void(0);
				jsh.unit.interface.create(suite, { view: getOptions().view, path: path });
			}

			return {
				addScenario: addScenario,
				run: run
			}
		};

		var suite = createTestSuite(Runner(jsh.script.file.pathname.basename));
		//jsh.loader.plugins(suite.getSrc().getRelativePath("jsh/test"));
		suite.run();
	}
//@ts-ignore
)(Packages,$api,jsh);
