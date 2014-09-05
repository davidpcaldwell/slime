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

var javassist = (function() {
	var response = new jsh.http.Client().request({
		url: parameters.options.javassist
	});
	if (response.status.code == 200) {
		var TMP = jsh.shell.TMPDIR.createTemporary({ prefix: "javassist.", suffix: ".jar" });
		TMP.pathname.write(response.body.stream, { append: false });
		return TMP;
	} else {
		jsh.shell.echo("Response code " + response.status.code + " for " + parameters.options.javassist);
		jsh.shell.exit(1);
	}
})();

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
