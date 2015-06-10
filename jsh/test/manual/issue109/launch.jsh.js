//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		output: jsh.file.Pathname
	}
});
var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
jsh.java.tools.javac({
	destination: tmp.pathname,
	arguments: [
		jsh.script.file.getRelativePath("java/Enabled.java").file,
		jsh.script.file.getRelativePath("java/Disabled.java").file
	]
});
jsh.loader.java.add(tmp.pathname);
var pairs = [
	{ name: "exclude", value: "Disabled" }
	,{ name: "exclude", value: "inonit.system" }
	,{ name: "exclude", value: "inonit.script" }
];
if (parameters.options.output) {
	pairs.push({ name: "output", value: parameters.options.output });
}
var JSH_SCRIPT_DEBUGGER = "profiler:" + pairs.map(function(pair) { return pair.name + "=" + pair.value; }).join(",");
jsh.shell.echo("JSH_SCRIPT_DEBUGGER: " + JSH_SCRIPT_DEBUGGER);
jsh.shell.run({
	command: jsh.shell.java.launcher,
	arguments: [
		"-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
		jsh.script.file.getRelativePath("main.jsh.js")
	],
	environment: {
		JSH_SCRIPT_DEBUGGER: JSH_SCRIPT_DEBUGGER,
		JSH_SCRIPT_CLASSPATH: tmp.pathname.toString()
	}
});
