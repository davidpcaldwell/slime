//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (jsh.shell.jsh.src && !jsh.shell.jsh.home) {
	var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.run({
		command: "jrunscript",
		arguments: [
			jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
			jsh.shell.jsh.src.getRelativePath("jsh/etc/unbuilt.rhino.js"),
			"build",
			tmpdir
		],
		environment: jsh.js.Object.set({}, {
			JSH_BUILD_NOTEST: "true",
			JSH_BUILD_NODOC: "true"
		})
	});
	jsh.shell.echo("Re-launching in built shell: " + tmpdir);
	jsh.shell.run({
		command: "jrunscript",
		arguments: [
			tmpdir.getRelativePath("jsh.js"),
			jsh.script.file
		].concat(jsh.script.arguments),
		evaluate: function(result) {
			jsh.shell.exit(result.status);
		}
	});
}

var parameters = jsh.script.getopts({
	options: {
		scenario: false,
		view: "console"
	}
});

//	TODO	currently this program can only be run in a built shell, because the packaging tool only works in a built shell

//jsh.shell.echo("Arguments: " + jsh.script.arguments);
if (parameters.options.scenario) {
	jsh.shell.echo("Creating scenario.");
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("loader/api"));
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("jsh/unit"));
	jsh.shell.echo("Loaded plugins.");
	var views = {
		child: function() {
			return new jsh.unit.view.Events({ writer: jsh.shell.stdio.output })
		},
		ui: function() {
			return new jsh.unit.view.WebView()
		},
		console: function() {
			return new jsh.unit.view.Console({ writer: jsh.shell.stdio.output })
		}
	};
	var scenario = new jsh.unit.Scenario({
		composite: true,
		name: jsh.script.file.pathname.basename,
		view: views[parameters.options.view]()
	});
	jsh.shell.echo("Created scenario.");
	var packaged_JSH_SHELL_CLASSPATH = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath(jsh.script.file.pathname.basename + ".jar");
	var engine = (jsh.shell.jsh.home.getFile("lib/js.jar")) ? [] : ["-norhino"];
	jsh.shell.echo("Packaging to " + packaged_JSH_SHELL_CLASSPATH);
	jsh.shell.jsh({
		fork: true,
		script: jsh.shell.jsh.home.getFile("tools/package.jsh.js"),
		arguments: [
			"-script", jsh.script.file.pathname,
			"-to", packaged_JSH_SHELL_CLASSPATH
		].concat(engine),
		evaluate: function(result) {
			if (result.status) {
				jsh.shell.echo("Exit status " + result.status + " from package.jsh.js");
				throw new Error();
			}
		}
	});
	var separator = String(Packages.java.lang.System.getProperty("line.separator"));
	scenario.add({ scenario: new function() {
		this.name = "unconfigured: " + packaged_JSH_SHELL_CLASSPATH;

		this.execute = function(scope) {
			var unconfigured = jsh.shell.java({
				jar: packaged_JSH_SHELL_CLASSPATH.file,
				stdio: {
					output: String
				},
				evaluate: function(result) {
					return result.stdio.output.split(separator)[0];
				}
			});
			var verify = new jsh.unit.Verify(scope);
			verify(unconfigured).is(String(packaged_JSH_SHELL_CLASSPATH.java.adapt().toURI().toString()));
		};
	}});
//	testCommandOutput(packaged_JSH_SHELL_CLASSPATH, function(options) {
//		var outputUri = options.output.split(String(Packages.java.lang.System.getProperty("line.separator")))[0];
//		var _outputFile = new Packages.java.io.File(new Packages.java.net.URI(outputUri));
//		if (String(_outputFile.getCanonicalPath()) == String(packaged_JSH_SHELL_CLASSPATH.getCanonicalPath())) {
//			Packages.java.lang.System.err.println("Same URI: " + outputUri + " and " + packaged_JSH_SHELL_CLASSPATH.toURI());
//		} else {
//			Packages.java.lang.System.err.println("Output wrong; dumping stderr:");
//			Packages.java.lang.System.err.println(options.err);
//			Packages.java.lang.System.err.println("Output file: " + _outputFile + " canonical: " + _outputFile.getCanonicalPath());
//			Packages.java.lang.System.err.println("Correct file: " + packaged_JSH_SHELL_CLASSPATH);
//			throw new Error("Output wrong; different URI: it is [" + options.output + "] when expected was [" + packaged_JSH_SHELL_CLASSPATH.toURI() + "]");
//		}
//	//	checkOutput(options,[
//	//		String(packaged_JSH_SHELL_CLASSPATH.toURI()),
//	//		""
//	//	]);
//	});

	//	Test was disabled as failing, attempting to re-enable to fix issue 79
//	scenario.add({
//		scenario: new function() {
//			this.name = "with JSH_SHELL_CLASSPATH";
//
//			this.execute = function(scope) {
//				var properties = {};
//				if (jsh.shell.rhino && jsh.shell.rhino.classpath) {
//					properties["jsh.engine.rhino.classpath"] = String(jsh.shell.rhino.classpath);
//				}
//				var output = jsh.shell.java({
//					properties: properties,
//					jar: packaged_JSH_SHELL_CLASSPATH.file,
//					stdio: {
//						output: String
//					},
//					environment: jsh.js.Object.set({}, jsh.shell.environment, {
//						JSH_SHELL_CLASSPATH: jsh.shell.jsh.home.getRelativePath("lib/jsh.jar").toString()
////						,JSH_RHINO_CLASSPATH: String(jsh.shell.rhino.classpath)
//						,JSH_LAUNCHER_DEBUG: "true"
//					}),
//					evaluate: function(result) {
//						return result.stdio.output.split(separator);
//					}
//				});
//				var verify = new jsh.unit.Verify(scope);
//				verify(output)[0].is(String(jsh.shell.jsh.home.getRelativePath("lib/jsh.jar").java.adapt().toURI().toString()));
//				jsh.shell.echo("Line 1: " + output[1]);
//			}
//		}
//	});
	scenario.run();
} else {
	var url = Packages.java.lang.Class.forName("inonit.script.jsh.Shell").getProtectionDomain().getCodeSource().getLocation().toString();
	jsh.shell.echo(url);
	jsh.shell.echo("url = " + url + " java.class.path = " + Packages.java.lang.System.getProperty("java.class.path"));
	jsh.shell.echo("Rhino context class: " + Packages.org.mozilla.javascript.Context);
}