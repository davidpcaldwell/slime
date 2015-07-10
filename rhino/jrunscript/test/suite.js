//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the InOnIt jrunscript API.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var run = function(p) {
	var assert = function(truth,description) {
		if (!truth) {
			throw new Error("ASSERTION FAILED: " + description);
		}
		echo(description);
	}

	try {
		var result;
		if (!p || (p && p.jdk)) {
			var jdk = (p && p.jdk) ? p.jdk : $api.java.install;
			echo("Executing: " + jdk.jrunscript);
			result = $api.shell.exec({
				command: jdk.jrunscript,
				arguments: [
					"api.js", "?relative=test/hello.js", "argument"
				],
				stdio: {
					output: String
				}
			});
		} else if (p && p.rhino) {
			echo("Executing Rhino: " + p.rhino + " with launcher " + $api.java.install.launcher);
			result = $api.shell.exec({
				command: $api.java.install.launcher,
				arguments: [
					"-jar", p.rhino, "-opt", "-1",
					"api.js", "?relative=test/hello.js", "argument"
				],
				stdio: {
					output: String
				}
			});
		}
		assert(result.status == 0, "Exit status was 0");
		var json = JSON.parse(result.stdio.output.split("\n")[1]);
		assert(json.arguments[0] == "argument", "Argument was passed through");
		//	TODO	we do not test Rhino for compiler existence
		if (jdk) assert(json.compile == "function", "Compiler is present");
	} catch (e) {
		echo(e + "\n" + e.stack);
		exit(1);
	}
}

if ($api.arguments.length > 0) {
	var environments = [];
	for (var i=0; i<$api.arguments.length; i++) {
		if ($api.arguments[i] == "-jdk") {
			environments.push({ jdk: new $api.java.Install(new Packages.java.io.File($api.arguments[++i])) });
		} else if ($api.arguments[i] == "-rhino") {
			environments.push({ rhino: new Packages.java.io.File($api.arguments[++i]) });
		} else {
			echo("Unrecognized: " + $api.arguments[i]);
		}
	}
	echo("Environments: " + environments);
	environments.forEach(run);
} else {
	if (typeof(Packages.org.mozilla.javascript.Context) == "function") {
		run({
			rhino: $api.rhino.classpath
		});
	} else {
		run();
	}
}