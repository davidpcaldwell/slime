//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		to: jsh.file.Pathname,
		javassist: jsh.file.Pathname
	}
});

if (!parameters.options.to) {
	parameters.options.to = jsh.shell.TMPDIR.createTemporary({ prefix: "profiler-", suffix: ".jar" });
}

var javassist;

if (!parameters.options.javassist) {
	jsh.shell.echo("Required: -javassist");
	jsh.shell.exit(1);
} else {
	javassist = parameters.options.javassist;
}

var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

jsh.java.tools.javac({
	destination: tmp.getRelativePath("classes"),
	classpath: jsh.file.Searchpath([javassist]),
	sourcepath: jsh.file.Searchpath([
		jsh.script.file.getRelativePath("java")
	]),
	arguments: [
		jsh.script.file.getRelativePath("java/inonit/tools/Profiler.java")
	]
});

var bins = [];
if (jsh.shell.java.home.parent.getSubdirectory("bin")) bins.push(jsh.shell.java.home.parent.getRelativePath("bin"));
if (jsh.shell.java.home.getSubdirectory("bin")) bins.push(jsh.shell.java.home.getRelativePath("bin"));
var searchpath = jsh.file.Searchpath(bins);

var jar = searchpath.getCommand("jar");

jsh.shell.shell(
	jar,
	[
		"xf", javassist
	],
	{
		workingDirectory: tmp.getSubdirectory("classes")
	}
);

var manifest = jsh.shell.TMPDIR.createTemporary({ suffix: "mf" });
manifest.pathname.write("Premain-Class: inonit.tools.Profiler\n", { append: false });
jsh.shell.shell(
	jar,
	[
		"cfm", parameters.options.to,
		manifest,
		//	TODO	should list directory
	].concat(
		tmp.getSubdirectory("classes").list().map(function(node) { return node.pathname.basename })
	),
	{
		workingDirectory: tmp.getSubdirectory("classes")
	}
);

jsh.shell.echo("Created JAR at " + parameters.options.to);
