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

		var parameters = jsh.script.getopts({
			options: {
				part: String,
				view: "console",
				"shell:built": jsh.file.Pathname
			}
		});

		var suite = new jsh.unit.Suite({
			name: jsh.script.file.pathname.basename
		});

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

		var path = (parameters.options.part) ? parameters.options.part.split("/") : void(0);
		jsh.unit.interface.create(suite, { view: parameters.options.view, path: path });
	}
//@ts-ignore
)(Packages,$api,jsh);
