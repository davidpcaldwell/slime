//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

#JVM_OPTION		-Xmx64m
#CLASSPATH		/foo/bar/baz
#JDK_LIBRARY	lib/tools.jar

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

var slime = jsh.loader.module(parameters.options.modules.directory.getRelativePath("1.slime"));
jsh.shell.echo(slime.data);
if (slime.data != "From Java") {
	jsh.shell.exit(1);
} else {
	jsh.shell.echo("Success: " + jsh.script.pathname.basename);
	jsh.shell.exit(0);
}