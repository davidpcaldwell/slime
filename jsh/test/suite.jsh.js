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
		java: jsh.shell.java.home.pathname,
		jsh: jsh.shell.jsh.home.pathname,
		src: jsh.script.file.getRelativePath("../.."),
		debug: false
	}
});

var java = jsh.file.Searchpath([parameters.options.java.directory.getRelativePath("bin")]).getCommand("java");

//	Unit tests
var modules = eval(parameters.options.src.directory.getFile("jsh/etc/api.js").read(String));
modules = jsh.js.Array(modules);
var apiArguments = modules.fold(function(array) {
	if (this.api) array.push("-api",this.api.path);
	return array;
},[]);

var subenv = {};
for (var x in jsh.shell.environment) {
	if (!/^JSH_/.test(x)) {
		subenv[x] = jsh.shell.environment[x];
	}
}
//	Provide way to set CATALINA_HOME?
//	Provide way to set JSH_LAUNCHER_DEBUG?
//	Provide way to set JSH_SCRIPT_DEBUGGER?
//	Provide way to set JSH_ENGINE?
jsh.shell.echo("Running unit tests ...");
jsh.shell.run({
	command: java,
	arguments: [
		"-jar", parameters.options.jsh.directory.getRelativePath("jsh.jar"),
		parameters.options.src.directory.getRelativePath("jsh/unit/jsapi.jsh.js")
	].concat(apiArguments),
	environment: subenv
});

jsh.shell.echo("Running system tests ...");
jsh.shell.run({
	command: java,
	arguments: [
		"-Djsh.home=" + parameters.options.jsh,
		"-Dslime.src=" + parameters.options.src,
		"-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
		parameters.options.src.directory.getRelativePath("jsh/test/integration.jsh.js"),
		"-src", parameters.options.src
	],
	environment: jsh.js.Object.set({}, jsh.shell.environment, {
		JSH_SCRIPT_DEBUGGER: (parameters.options.debug) ? "rhino" : "none"
	})
});
