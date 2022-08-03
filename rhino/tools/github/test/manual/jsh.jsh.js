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
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var base = jsh.script.file.parent.parent.parent.parent.parent.parent;

		var api = jsh.script.file.parent.parent.parent;

		var loader = new jsh.file.Loader({ directory: api });

		jsh.loader.plugins(api);

		var code = {
			/** @type { slime.jsh.unit.mock.github.test.Script } */
			testing: loader.script("test/module.js")
		};

		var library = {
			testing: code.testing({
				slime: base
			})
		};

		var emit = function(paste) {
			jsh.shell.console(paste);
			if (jsh.shell.PATH.getCommand("pbcopy")) {
				jsh.shell.run({
					command: "pbcopy",
					stdio: {
						input: paste
					}
				});
				jsh.shell.console("Copied to clipboard.");
			}
		}

		jsh.script.cli.wrap({
			commands: {
				serve: $api.Function.pipe(
					//	emit information about requests sent to GitHub
					jsh.script.cli.option.boolean({ longname: "optimize" }),

					//	turn on jsh launcher console-based debugging
					jsh.script.cli.option.boolean({ longname: "debug" }),

					function(p) {
						var web = library.testing.startMock(jsh);
						jsh.shell.console("HTTP port: " + web.port + " HTTPS port: " + web.https.port);
						var token = jsh.shell.jsh.src.getFile("local/github/tokens/davidpcaldwell");
						var command = library.testing.getCommandLine(jsh.shell.PATH, {
							mock: web,
							optimize: p.options.optimize,
							debug: p.options.debug,
							token: (token) ? function() { return token.read(String); } : void(0)
						});
						emit(command);
						web.run();
					}
				),
				remote: function() {
					//	TODO	for now, we do not fully automate this command because of the piping
					var command = library.testing.getCommandLine(jsh.shell.PATH, {
						token: function() { return jsh.shell.jsh.src.getFile("local/github/tokens/davidpcaldwell").read(String); }
					});
					emit(command);
				},
				test: $api.Function.pipe(
					//	turn on jsh launcher console-based debugging
					jsh.script.cli.option.boolean({ longname: "debug" }),
					function(p) {
						var command = library.testing.getCommandLine(jsh.shell.PATH, {
							debug: p.options.debug
						});
						emit(command);
					}
				)
			}
		});
	}
//@ts-ignore
)($api,jsh);
