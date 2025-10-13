//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var parameters = jsh.script.getopts({
			options: {
				initialize: false,
				output: false,
				require: false
			}
		});

		var installed = jsh.internal.api.rhino.forCurrentJava().local( jsh.shell.jsh.lib.pathname.os.adapt() );

		if (parameters.options.initialize) {
			if (installed) {
				installed.forEach(jsh.file.Location.remove.simple);
			}
			jsh.shell.exit(0);
		}

		if (parameters.options.require) {
			jsh.shell.tools.rhino.require.simple();
		}

		if (parameters.options.output) {
			jsh.shell.echo(JSON.stringify({
				engine: jsh.shell.engine
			}));
			jsh.shell.exit(0);
		}

		var run = function(require) {
			jsh.shell.console("Running script ...");
			return jsh.shell.jsh({
				shell: jsh.shell.jsh.src,
				script: jsh.script.file,
				arguments: (function() {
					var rv = [];
					rv.push("-output");
					if (require) rv.push("-require");
					return rv;
				})(),
				stdio: {
					output: String
				},
				evaluate: function(result) {
					jsh.shell.console(result.stdio.output);
					return JSON.parse(result.stdio.output);
				}
			});
		};

		var fail = function() {
			jsh.shell.console("Failure.");
			jsh.shell.exit(1);
		}

		//	Ensure Rhino not present at start of test
		if (installed) {
			jsh.shell.console("Remove Rhino first.");
			jsh.shell.exit(1);
		}

		var before = run(false);
		if (before.engine != "nashorn") fail();
		var install = run(true);
		if (install.engine != "rhino") fail();
		var after = run(false);
		if (after.engine != "rhino") fail();
		jsh.shell.console("Success.");
	}
//@ts-ignore
)(jsh);
