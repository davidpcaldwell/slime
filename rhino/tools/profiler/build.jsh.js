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
		javassist: jsh.file.Pathname,
		to: jsh.file.Pathname
	}
});

if (!jsh.tools || !jsh.tools.install) {
	jsh.loader.plugins(jsh.shell.jsh.home.getSubdirectory("src").getRelativePath("jsh/tools/install"));
}
if (!parameters.options.javassist) {
	parameters.options.javassist = jsh.tools.install.get({ url: "https://github.com/jboss-javassist/javassist/releases/download/rel_3_20_0_ga/javassist.jar" }).pathname;
}

if (!parameters.options.to) {
	jsh.shell.echo("Required: -to");
	jsh.shell.exit(1);
}

var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

jsh.shell.echo("Compiling profiler ...");
jsh.java.tools.javac({
	destination: tmp.getRelativePath("classes"),
	classpath: jsh.file.Searchpath([parameters.options.javassist]),
	sourcepath: jsh.file.Searchpath([
		jsh.script.file.getRelativePath("java")
	]),
	arguments: [
		jsh.script.file.getRelativePath("java/inonit/tools/Profiler.java")
	]
});

//	TODO	replace need for jar tool

//	TODO	replace jsh.shell.shell

var bins = [];
if (jsh.shell.java.home.parent.getSubdirectory("bin")) bins.push(jsh.shell.java.home.parent.getRelativePath("bin"));
if (jsh.shell.java.home.getSubdirectory("bin")) bins.push(jsh.shell.java.home.getRelativePath("bin"));
var searchpath = jsh.file.Searchpath(bins);

var jar = searchpath.getCommand("jar");

jsh.shell.shell(
	jar,
	[
		"xf", parameters.options.javassist
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

jsh.shell.console("Created JAR at " + parameters.options.to);
