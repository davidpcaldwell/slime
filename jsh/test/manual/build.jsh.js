//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.shell.console("File has been invalidated by removal of echo.jsh.js and other changes to unit testing.");
jsh.shell.exit(1);

var SLIME = jsh.script.file.parent.parent.parent.parent;
jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/test"));

var parameters = jsh.script.getopts({
	options: {
		rhino: jsh.file.Pathname,
		"debug:script": String
	}
});

var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
var INSTALLER = jsh.shell.TMPDIR.createTemporary({ prefix: "jsh-install", suffix: ".jar" });
var INSTALLED = jsh.shell.TMPDIR.createTemporary({ directory: true });

jsh.shell.jsh({
	fork: true,
	properties: {
		"jsh.engine.rhino.classpath": parameters.options.rhino,
//		"jsh.build.notest": "true",
//		"jsh.build.nodoc": "true",
		"jsh.debug.script": (parameters.options["debug:script"]) ? parameters.options["debug:script"] : null
	},
	script: SLIME.getFile("jsh/etc/build.jsh.js"),
	arguments: [TMP]
});

jsh.shell.jsh({
	fork: true,
	properties: {
		"jsh.engine.rhino.classpath": parameters.options.rhino,
		"jsh.build.notest": "true",
		"jsh.build.nodoc": "true"
	},
	script: SLIME.getFile("jsh/etc/build.jsh.js"),
	arguments: ["-installer", INSTALLER]
});

jsh.shell.java({
	jar: INSTALLER,
	arguments: ["-to", INSTALLED, "-replace"]
});

var echo = jsh.shell.jsh({
	shell: TMP,
	script: SLIME.getFile("jsh/test/jsh.shell/echo.jsh.js"),
	stdio: {
		output: String
	}
});

//	TODO	Consider Scenario.Composite
var top = new jsh.unit.Scenario({
	name: "Build tests",
	composite: true,
	view: new jsh.unit.view.Console({ writer: jsh.shell.stdio.error })
});

top.add({
	scenario: new jsh.unit.Scenario({
		execute: function(scope) {
			var verify = new jsh.unit.Verify(function(f) {
				scope.test(f);
			});
			var output = echo.stdio.output.split(String(Packages.java.lang.System.getProperty("line.separator")));
			verify(output)[0].is("true");
		}
	})
});

top.add({
	scenario: new jsh.unit.Scenario({
		execute: function(scope) {
			var verify = new jsh.unit.Verify(function(f) {
				scope.test(f);
			});
			var echo = jsh.shell.jsh({
				shell: INSTALLED,
				script: SLIME.getFile("jsh/test/jsh.shell/echo.jsh.js"),
				stdio: {
					output: String
				},
			});
			var output = echo.stdio.output.split(String(Packages.java.lang.System.getProperty("line.separator")));
			verify(output)[0].is("true");
		}
	})
});

top.run();

jsh.shell.echo("To examine shell, visit:");
jsh.shell.echo(TMP);

//	TODO	add test case for Nashorn
//	TODO	add test case for building shell over HTTP
//	TODO	add test case for building installer over HTTP

