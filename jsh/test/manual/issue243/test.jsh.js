//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		build: jsh.file.Pathname,
		debug: false
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!parameters.options.build) parameters.options.build = (function() {
	var dir = jsh.shell.TMPDIR.createTemporary({ directory: true });
	var rv = dir.pathname;
	dir.remove();
	return rv;
})();

jsh.shell.jsh({
	script: jsh.shell.jsh.src.getFile("jsh/etc/build.jsh.js"),
	arguments: [parameters.options.build,"-notest","-nodoc"]
});

var built = parameters.options.build.directory;
var environment = (parameters.options.debug) ? { JSH_DEBUG_SCRIPT: "rhino" } : {};
jsh.shell.console("Running unit tests with arguments " + parameters.arguments.join(" ") + " and environment " + JSON.stringify(environment));
jsh.shell.jsh({
	shell: built,
	script: built.getFile("src/jsh/test/unit.jsh.js"),
	arguments: parameters.arguments,
	environment: jsh.js.Object.set({}, jsh.shell.environment, environment)
});
