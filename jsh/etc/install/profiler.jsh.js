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
		javassist: "https://github.com/jboss-javassist/javassist/releases/download/rel_3_18_2_ga_build/javassist.jar",
		src: jsh.shell.jsh.home.getRelativePath("src")
	}
});

var api = jsh.script.loader.file("api.js");

var javassist = api.download({
	url: parameters.options.javassist,
	name: "javassist-3.18.2.GA.jar"
});

var src = parameters.options.src.directory;

var args = [];
args.push("-javassist", javassist);
args.push("-to", jsh.shell.jsh.home.getRelativePath("tools/profiler.jar"));

jsh.shell.jsh({
	script: parameters.options.src.directory.getFile("rhino/tools/profiler/build.jsh.js"),
	arguments: args
});
src.getSubdirectory("rhino/tools/profiler/viewer").copy(jsh.shell.jsh.home.getRelativePath("tools/profiler/viewer"), { recursive: true });
jsh.shell.echo("Installed profiler to " + jsh.shell.jsh.home.getRelativePath("tools/profiler.jar") + " and " + jsh.shell.jsh.home.getRelativePath("tools/profiler"));
//jsh.shell.jsh.home.getRelativePath("tools/profiler/viewer").createDirectory({
//	ifExists: function(dir) {
//		return false;
//	},
//	recursive: true
//});
//new File(JSH_HOME,"tools/profiler/viewer").mkdirs();
//copyFile(new File(SLIME_SRC,"rhino/tools/profiler/viewer"), new File(JSH_HOME,"tools/profiler/viewer"));
