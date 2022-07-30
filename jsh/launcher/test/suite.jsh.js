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
	 * @param { slime.jsh.Global & { test: any } } jsh
	 */
	function($api,jsh) {
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

		/** @type { slime.$api.fp.impure.Input<{ part: string, view: string, "shell:built": slime.jrunscript.file.Pathname }> } */
		var getScriptOptions = function() {
			var parameters = jsh.script.getopts({
				options: {
					part: String,
					view: "console",
					"shell:built": jsh.file.Pathname
				}
			});
			return parameters.options;
		}

		/**
		 *
		 * @param { string } suiteName
		 * @param { string } view
		 * @returns { slime.jsh.internal.launcher.test.SuiteRunner & { run: (part: string) => void } }
		 */
		var Runner = function(suiteName,view) {
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
				jsh.unit.interface.create(suite, { view: view, path: path });
			}

			return {
				addScenario: addScenario,
				run: run
			}
		};

		var runner = Runner(jsh.script.file.pathname.basename, getScriptOptions().view);
		var suite = library.script.createTestSuite(
			jsh,
			{
				built: getScriptOptions()["shell:built"]
			},
			runner
		);
		//jsh.loader.plugins(suite.getSrc().getRelativePath("jsh/test"));
		runner.run(getScriptOptions().part);
	}
//@ts-ignore
)($api,jsh);
