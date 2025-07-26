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
			/** @type { slime.jrunscript.tools.github.mock.project.Script } */
			testing: loader.script("test/module.js")
		};

		var library = {
			testing: code.testing({
				slime: base,
				library: {
					shell: jsh.shell
				}
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
				serve: $api.fp.pipe(
					//	emit information about requests sent to GitHub
					jsh.script.cli.option.boolean({ longname: "optimize" }),

					//	turn on jsh launcher console-based debugging
					jsh.script.cli.option.boolean({ longname: "debug" }),

					function(p) {
						var web = library.testing.startMock(jsh);
						jsh.shell.console("HTTP port: " + web.port + " HTTPS port: " + web.https.port);
						var token = jsh.shell.jsh.src.getFile("local/github/tokens/davidpcaldwell");
						var command = library.testing.getCommandLine({
							PATH: jsh.shell.PATH,
							settings: {
								mock: web,
								optimize: p.options.optimize,
								debug: p.options.debug,
								token: (token) ? function() { return token.read(String); } : void(0)
							},
							script: "jrunscript/jsh/test/jsh-data.jsh.js"
						});
						emit(command);
						web.run();
					}
				),
				remote: function() {
					//	TODO	for now, we do not fully automate this command because of the piping
					var command = library.testing.getCommandLine({
						PATH: jsh.shell.PATH,
						settings: {
							token: function() { return jsh.shell.jsh.src.getFile("local/github/tokens/davidpcaldwell").read(String); }
						},
						script: "jrunscript/jsh/test/jsh-data.jsh.js"
					});
					emit(command);
				},
				test: $api.fp.pipe(
					//	turn on jsh launcher console-based debugging
					jsh.script.cli.option.boolean({ longname: "debug" }),
					function(p) {
						var command = library.testing.getCommandLine({
							PATH: jsh.shell.PATH,
							settings: {
								debug: p.options.debug
							},
							script: "jrunscript/jsh/test/jsh-data.jsh.js"
						});
						emit(command);
					}
				)
			}
		});
	}
//@ts-ignore
)($api,jsh);
