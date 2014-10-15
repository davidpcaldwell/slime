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
		javassist: jsh.file.Pathname,
		test: String,
		"test:debug": false,
		"test:logging": jsh.file.Pathname,
		"test:engine": String,
		"test:internal": false,
		"test:agentlib": String,
		"test:output": jsh.file.Pathname
	}
});

if (!parameters.options.to) {
	parameters.options.to = jsh.shell.TMPDIR.createTemporary({ suffix: ".jar" });
}

var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

var javassist;

if (!parameters.options.javassist) {
	jsh.shell.echo("Required: -javassist");
	jsh.shell.exit(1);
} else {
	javassist = parameters.options.javassist;
}

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

jsh.java.tools.javac({
	destination: tmp.getRelativePath("test"),
	classpath: jsh.file.Searchpath([]),
	sourcepath: jsh.file.Searchpath([
		jsh.script.file.getRelativePath("java")
	]),
	arguments: [
		jsh.script.file.getRelativePath("java/inonit/tools/Test.java")
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

if (parameters.options.test) {
	if (parameters.options.test == "java" || parameters.options.test == "all") {
		jsh.shell.shell(
			jsh.shell.java.home.getFile("bin/java"),
			[
				"-javaagent:" + parameters.options.to,
				"-classpath", tmp.getRelativePath("test"),
				"inonit.tools.Test"
			],
			{
				onExit: function(result) {
					jsh.shell.echo(result.command + " " + result.arguments.join(" "));
					jsh.shell.echo("Exit status: "  + result.status);
				}
			}
		)
	}
	if (parameters.options.test == "script" || parameters.options.test == "all") {
		//	TODO	would be better to use jsh.shell.jsh, but would need to guarantee forking, which upcoming version may not
		var evaluate = function(result) {
			jsh.shell.echo(result.command + " " + result.arguments.join(" "));
			jsh.shell.echo("Exit status: "  + result.status);
		};
		var agentlib = (parameters.options["test:agentlib"]) ? ["-agentlib:" + parameters.options["test:agentlib"]] : [];
		var pairs = [];
		if (parameters.options["test:debug"]) {
			pairs.push({
				name: "debug",
				value: "true"
			});
		}
		if (parameters.options["test:output"]) {
			pairs.push({
				name: "output",
				value: parameters.options["test:output"].toString()
			});
		}
		var profilerSettings = pairs.map(function(pair) { return pair.name + "=" + pair.value; }).join(",");
		var vmarguments = ["-javaagent:" + parameters.options.to + "=" + profilerSettings].concat(agentlib).concat((parameters.options["test:debug"]) ? ["-verbose:class"] : []);
		if (parameters.options["test:logging"]) {
			vmarguments.push("-Djava.util.logging.config.file=" + parameters.options["test:logging"]);
		}
		var extdirs = String(Packages.java.lang.System.getProperty("java.ext.dirs"));
		extdirs += ":" + parameters.options.to.parent.toString();
		vmarguments.push("-Djava.ext.dirs=" + extdirs);
		jsh.shell.echo("VM arguments: " + vmarguments);
		if (true) {
			jsh.shell.java({
				vmarguments: (parameters.options["test:internal"]) ? vmarguments : [],
				jar: jsh.shell.jsh.home.getRelativePath("jsh.jar"),
				arguments: [
					jsh.script.file.getRelativePath("../../../jsh/test/jsh.shell/properties.jsh.js")
				],
				environment: jsh.js.Object.set({}, jsh.shell.environment, {
					JSH_LAUNCHER_INTERNAL: (parameters.options["test:internal"]) ? "true" : "",
					JSH_SCRIPT_DEBUGGER: "profiler" + ((profilerSettings) ? ":" + profilerSettings : ""),
//					JSH_LAUNCHER_CONSOLE_DEBUG: "true",
//					JSH_JVM_OPTIONS: (!parameters.options["test:internal"]) ? vmarguments.join(" ") : "",
					JSH_ENGINE: (parameters.options["test:engine"]) ? parameters.options["test:engine"] : ""
				}),
				evaluate: evaluate
			});
		} else if (true) {
			jsh.shell.java({
				vmarguments: [
					"-javaagent:" + parameters.options.to
				],
				jar: jsh.shell.jsh.home.getRelativePath("jsh.jar"),
				arguments: [
					jsh.script.file.getRelativePath("../../../jsh/test/jsh.shell/properties.jsh.js")
				],
				environment: jsh.js.Object.set({}, jsh.shell.environment, {
					JSH_LAUNCHER_INTERNAL: "true",
					JSH_SCRIPT_DEBUGGER: profiler,
					JSH_LAUNCHER_CONSOLE_DEBUG: "true",
					JSH_ENGINE: "nashorn"
				}),
				evaluate: function(result) {
					jsh.shell.echo(result.command + " " + result.arguments.join(" "));
					jsh.shell.echo("Exit status: "  + result.status);
				}
			});
		} else {
			jsh.shell.shell(
				jsh.shell.java.home.getFile("bin/java"),
				[
					"-classpath", jsh.shell.jsh.home.getRelativePath("jsh.jar"),
					"inonit.script.jsh.launcher.Main",
					jsh.script.file.getRelativePath("test.jsh.js")
				],
				{
					environment: jsh.js.Object.set({}, jsh.shell.environment, {
						JSH_JVM_OPTIONS: "-javaagent:" + parameters.options.to,
						JSH_SCRIPT_DEBUGGER: "profiler"
					}),
					onExit: function(result) {
						jsh.shell.echo(result.command + " " + result.arguments.join(" "));
						jsh.shell.echo("Exit status: "  + result.status);
					}
				}
			)
		}
	}
}
