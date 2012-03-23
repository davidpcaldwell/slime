//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
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

var parameters = jsh.shell.getopts({
	options: {
		modules: (jsh.shell.environment.MODULES) ? jsh.file.Pathname(jsh.shell.environment.MODULES) : jsh.file.Pathname
	}
});

var slime = jsh.loader.module(parameters.options.modules.directory.getRelativePath("1.slime"));
jsh.shell.echo(slime.data);
if (slime.data != "From Java") {
	jsh.shell.exit(1);
} else {
	jsh.shell.echo("Success: " + jsh.script.pathname.basename);
	jsh.shell.exit(0);
}