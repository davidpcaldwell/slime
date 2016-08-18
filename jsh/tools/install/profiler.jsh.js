//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
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
		javassist: jsh.file.Pathname,
		src: jsh.shell.jsh.home.getRelativePath("src")
	}
});

var src = parameters.options.src.directory;

var args = [];
if (parameters.options.javassist) {
	args.push("-javassist", parameters.options.javassist);
}
args.push("-to", jsh.shell.jsh.home.getRelativePath("tools/profiler.jar"));

jsh.shell.jsh({
	script: parameters.options.src.directory.getFile("rhino/tools/profiler/build.jsh.js"),
	arguments: args
});
src.getSubdirectory("rhino/tools/profiler/viewer").copy(jsh.shell.jsh.home.getRelativePath("tools/profiler/viewer"), { recursive: true });
jsh.shell.echo("Installed profiler to " + jsh.shell.jsh.home.getRelativePath("tools/profiler.jar") + " and " + jsh.shell.jsh.home.getRelativePath("tools/profiler"));
