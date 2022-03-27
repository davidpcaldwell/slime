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
				tests: jsh.file.Pathname
			}
		});
		if (!parameters.options.tests) {
			jsh.shell.console("Required: -tests");
			jsh.shell.exit(1);
		}
		var tests = parameters.options.tests.file;
		if (!tests) {
			jsh.shell.console("Not found: " + parameters.options.tests);
			jsh.shell.exit(1);
		}
		var parsed = /^(.*)\.fifty\.ts$/.exec(tests.pathname.basename);
		if (!parsed) {
			jsh.shell.console("tests must be a .fifty.ts file.");
			jsh.shell.exit(1);
		}
		var destination = tests.parent.getRelativePath(parsed[1] + ".api.html");
		if (destination.file) {
			jsh.shell.console("Already exists: " + destination + "; remove first.");
			jsh.shell.exit(1);
		}
		var template = jsh.file.Pathname(jsh.shell.environment.BASE).directory.getFile("tools/fifty/test/data/api.html");
		var html = template.read(String);
		html = html.replace(/module\.fifty\.ts/g, tests.pathname.basename);
		destination.write(html);
		jsh.shell.console("Wrote " + destination + " to invoke " + tests + " from jsapi.");
	}
//@ts-ignore
)(jsh);
