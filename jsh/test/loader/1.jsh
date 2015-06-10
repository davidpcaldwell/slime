//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2011-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//#JVM_OPTION		-Xmx64m
//#CLASSPATH		/foo/bar/baz
//#JDK_LIBRARY	lib/tools.jar

var parameters = jsh.script.getopts({
	options: {
		modules: (jsh.shell.environment.MODULES) ? jsh.file.Pathname(jsh.shell.environment.MODULES) : jsh.file.Pathname
	}
});

if (!parameters.options.modules) {
	jsh.shell.echo("jsh.shell.environment.MODULES = " + jsh.shell.environment.MODULES);
	for (var x in jsh.shell.environment) {
		jsh.shell.echo(x + " = [" + jsh.shell.environment[x] + "]");
	}
	if (jsh.shell.environment.MODULES) {
		jsh.shell.echo("jsh.file.Pathname(jsh.shell.environment.MODULES) = " + jsh.file.Pathname(jsh.shell.environment.MODULES));
		jsh.shell.echo("jsh.file.filesystems.os.Pathname(jsh.shell.environment.MODULES) = " + jsh.file.filesystems.os.Pathname(jsh.shell.environment.MODULES));
	}
	jsh.shell.exit(1);
}

//	TODO	would be nice to figure out how to get the below to trigger a breakpoint when running inside jsh.shell.jsh
debugger;
var slime = jsh.loader.module(parameters.options.modules.directory.getRelativePath("1.slime"), {
	//	TODO	load slime module with reference to application class loader to work around bug in jsh.shell.jsh subshells;
	//			see loader/rhino/test/data/1/module.js for more information.
	java: {
		getClass: function(name) {
			return jsh.loader.$getClass(name);
		}
	}
});
jsh.shell.echo(slime.data);
if (slime.data != "From Java") {
	jsh.shell.echo("Did not get slime class in " + parameters.options.modules.directory.getRelativePath("1.slime"));
	jsh.shell.exit(1);
} else {
	jsh.shell.echo("Success: " + jsh.script.pathname.basename);
	jsh.shell.exit(0);
}