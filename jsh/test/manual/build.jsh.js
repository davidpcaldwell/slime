//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var SLIME = jsh.script.file.parent.parent.parent.parent;
jsh.loader.plugins(SLIME.getRelativePath("loader/api"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/unit"));
jsh.loader.plugins(SLIME.getRelativePath("jsh/test"));

var parameters = jsh.script.getopts({
	options: {
		rhino: jsh.file.Pathname
	}
});

var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });

jsh.shell.jsh({
	fork: true,
	properties: {
		"jsh.engine.rhino.classpath": parameters.options.rhino,
		"jsh.build.notest": "true",
		"jsh.build.nodoc": "true"
	},
	script: SLIME.getFile("jsh/etc/build.rhino.js"),
	arguments: [TMP]
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
			var verify = new jsh.unit.Verify(scope);
			var output = echo.stdio.output.split(String(Packages.java.lang.System.getProperty("line.separator")));
			verify(output)[0].is("true");
		}
	})
});

top.run();
//	TODO	add run of shell to verify it is working

//	TODO	add test case for Nashorn
//	TODO	add test case for installer
//	TODO	add test case for building shell over HTTP
//	TODO	add test case for building installer over HTTP

