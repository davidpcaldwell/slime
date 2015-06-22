//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.io && jsh.shell && jsh.unit;
	},
	load: function() {
		var ForkScenario = function(p) {
			return new jsh.unit.Scenario({
				name: p.name,
				execute: function(scope) {
					p.method(jsh.js.Object.set({}, p, {
						evaluate: function(result) {
							scope.test(function() {
								return {
									success: !result.status,
									message: "Exit status " + result.status
								}
							});
						}
					}))
				}
			});
		}

		jsh.unit.CommandScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.run
			}));
		};
		jsh.unit.ScriptScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.jsh
			}));
		};
		jsh.unit.Scenario.Integration = function(p) {
			var buffer = new jsh.io.Buffer();
			var write = buffer.writeBinary();
			return jsh.shell.jsh({
				fork: true,
				script: p.script,
				arguments: ["-scenario", "-view", "child"],
				stdio: {
					output: write
				},
				evaluate: function(result) {
					write.java.adapt().flush();
					buffer.close();
					return new jsh.unit.Scenario.Stream({
						name: p.script.toString(),
						stream: buffer.readBinary()
					});
				}
			})
		}
		jsh.unit.integration = function(o) {
			var parameters = jsh.script.getopts({
				options: {
					scenario: false,
					view: "console"
				},
				unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
			});
			if (parameters.options.scenario) {
				var views = {
					child: function() {
						return new jsh.unit.view.Events({ writer: jsh.shell.stdio.output })
					},
					webview: function() {
						return new jsh.unit.view.WebView()
					},
					console: function() {
						return new jsh.unit.view.Console({ writer: jsh.shell.stdio.output })
					}
				};
				var scenario = new jsh.unit.Scenario({
					composite: true,
					name: jsh.script.file.pathname.basename,
					view: views[parameters.options.view]()
				});
				o.scenario.apply(scenario,parameters.arguments);
				scenario.run();
			} else {
				var getopts = (o.getopts) ? jsh.script.getopts(o.getopts, parameters.arguments) : { options: {} };
				o.run(getopts);
			}
		}
	}
})