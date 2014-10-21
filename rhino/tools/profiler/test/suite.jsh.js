//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		"build:javassist": jsh.file.Pathname,
		build: String,
		tests: "script",
		jar: jsh.file.Pathname,
		engine: jsh.script.getopts.ARRAY(String),
		launcher: jsh.script.getopts.ARRAY(String),
		agentlib: String,
		output: jsh.file.Pathname,
		debug: false,
		logging: jsh.file.Pathname
	}
});

if (!parameters.options.launcher.length) {
	parameters.options.launcher = ["classloader","jvm"];
}
if (!parameters.options.engine.length) {
	parameters.options.engine = ["rhino","nashorn"];
}

if (!parameters.options.jar) {
	var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
	parameters.options.jar = tmpdir.createTemporary({ suffix: ".jar" });
}

if (parameters.options.build == "shell" || parameters.options.build == "all") {
	throw new Error("Need to implement standard way to build shell from within jsh");
}
if (parameters.options.build == "profiler" || parameters.options.build == "all") {
	jsh.shell.jsh({
		script: jsh.script.file.getRelativePath("../build.jsh.js").file,
		arguments: [
			"-javassist", parameters.options["build:javassist"],
			"-to", parameters.options.jar
		]
	});
	jsh.shell.echo("Built profiler to " + parameters.options.jar);
}

var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

if (parameters.options.tests == "java" || parameters.options.tests == "all") {
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
	jsh.shell.echo("Created test classes at " + tmp.getRelativePath("test"));

	jsh.shell.shell(
		jsh.shell.java.home.getFile("bin/java"),
		[
			"-javaagent:" + parameters.options.jar,
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

if (parameters.options.tests == "script" || parameters.options.tests == "all") {
	var getOutput = function(engine,launcher) {
		if (parameters.options.engine.length > 1 || parameters.options.launcher.length > 1 || !/\.html$/.test(parameters.options.output)) {
			//	pathname is directory
			if (!arguments.callee.created) {
				if (parameters.options.output.directory) {
					parameters.options.output.directory.remove();
				}
				parameters.options.output.createDirectory();
				arguments.callee.created = true;
			}
			return parameters.options.output.directory.getRelativePath("profile." + engine + "." + launcher + ".html");
		} else {
			return parameters.options.output;
		}
	}

	var test = function(engine,launcher) {
		var evaluate = function(result) {
			jsh.shell.echo(result.command + " " + result.arguments.join(" "));
			jsh.shell.echo("Exit status: "  + result.status);
		};

		//	TODO	would be better to use jsh.shell.jsh, but would need to guarantee forking, which upcoming version may not
		var agentlib = (parameters.options.agentlib) ? ["-agentlib:" + parameters.options.agentlib] : [];
		var pairs = [];
		if (parameters.options.debug) {
			pairs.push({
				name: "debug",
				value: "true"
			});
		}
		if (parameters.options.output) {
			pairs.push({
				name: "output",
				value: getOutput(engine,launcher).toString()
			});
		}
		var profilerSettings = pairs.map(function(pair) { return pair.name + "=" + pair.value; }).join(",");
		var vmarguments = (engine == "rhino" && launcher == "jvm") ? [] : ["-javaagent:" + parameters.options.jar + "=" + profilerSettings];
		var vmarguments = vmarguments.concat(agentlib).concat((parameters.options.debug) ? [/*"-verbose:class"*/] : []);
		if (parameters.options.logging) {
			vmarguments.push("-Djava.util.logging.config.file=" + parameters.options.logging);
		}
		var extdirs = String(Packages.java.lang.System.getProperty("java.ext.dirs"));
		extdirs += ":" + parameters.options.jar.parent.toString();
		vmarguments.push("-Djava.ext.dirs=" + extdirs);
		jsh.shell.echo("VM arguments: " + vmarguments);
		jsh.shell.java({
			vmarguments: (launcher == "classloader") ? vmarguments : [],
			jar: jsh.shell.jsh.home.getRelativePath("jsh.jar"),
			arguments: [
				jsh.script.file.getRelativePath("../../../../jsh/test/jsh.shell/properties.jsh.js")
			],
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				JSH_SHELL_CONTAINER: launcher,
				JSH_SCRIPT_DEBUGGER: "profiler" + ((profilerSettings) ? ":" + profilerSettings : ""),
//					JSH_LAUNCHER_CONSOLE_DEBUG: "true",
				JSH_JVM_OPTIONS: (launcher == "jvm") ? vmarguments.join(" ") : "",
				JSH_ENGINE: (engine) ? engine : "",
				JSH_PROFILER_MODULE: jsh.script.file.getRelativePath("../viewer/module.js").toString()
			}),
			evaluate: evaluate
		});
	};

	parameters.options.engine.forEach(function(engine) {
		parameters.options.launcher.forEach(function(launcher) {
			test(engine,launcher);
		})
	});
}