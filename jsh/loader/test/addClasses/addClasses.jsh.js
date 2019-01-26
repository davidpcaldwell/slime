//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2011-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

Packages.java.lang.System.err.println("Starting addClasses");
var parameters = jsh.script.getopts({
	options: {
		scenario: false,
		part: String,
		classes: jsh.file.Pathname,
		jar: jsh.file.Pathname,
		search: false,
		"test:issue281": false
	}
});

if (parameters.options.scenario) {
	var parts = (function(part) {
		var rv = {
			classes: true,
			jar: true,
			jarsearch: true
		};
		if (part) {
			for (var x in rv) {
				if (x != part) rv[x] = false;
			}
		}
		return rv;
	})(parameters.options.part);
	var issue281 = (parameters.options["test:issue281"]) ? ["-test:issue281"] : [];
	jsh.loader.plugins(jsh.script.file.getRelativePath("../../../rhino/tools"));
	var destination = jsh.shell.TMPDIR.createTemporary({ directory: true });
	var jardestination = jsh.shell.TMPDIR.createTemporary({ directory: true });
	var jar = jardestination.createTemporary({ suffix: ".jar" }).pathname;
	jar.file.remove();
	jsh.java.tools.javac({
		destination: destination.pathname,
		arguments: [
			jsh.script.file.getRelativePath("java/test/AddClasses.java")
		]
	});
	jsh.shell.console("Compiled to " + destination);
	jsh.file.zip({
		from: destination,
		to: jar
	});

	if (parts.classes) {
		jsh.shell.jsh({
			script: jsh.script.file,
			arguments: ["-classes", destination].concat(issue281),
			evaluate: function(result) {
				jsh.shell.console("Status: " + result.status);
				if (result.status != 0) {
					throw new Error("Status from addClasses.jsh.js: " + result.status);
				}
			}
		});
	}
	if (parts.jar) {
		jsh.shell.jsh({
			fork: true,
			script: jsh.script.file,
			arguments: ["-jar", jar].concat(issue281),
			evaluate: function(result) {
				jsh.shell.console("Status: " + result.status);
				if (result.status != 0) {
					throw new Error("Status from addClasses.jsh.js: " + result.status);
				}
			}
		});
	}
	if (parts.jarsearch) {
		jsh.shell.jsh({
			fork: true,
			script: jsh.script.file,
			arguments: ["-jar", jardestination, "-search"].concat(issue281),
			evaluate: function(result) {
				jsh.shell.console("Status: " + result.status);
				if (result.status != 0) {
					throw new Error("Status from addClasses.jsh.js: " + result.status);
				}
			}
		});
	}
	if (jsh.shell.jsh.home) {
		var tmpfile = jsh.shell.TMPDIR.createTemporary({ prefix: "addClasses.", suffix: ".jar" });
		jsh.shell.echo("Packaging ...");
		jsh.shell.jsh({
			fork: true,
			script: jsh.shell.jsh.home.getRelativePath("tools/package.jsh.js"),
			arguments: (function(rv) {
				rv.push("-script", jsh.script.file);
				rv.push("-to", tmpfile);
				if (!jsh.shell.jsh.lib.getFile("js.jar")) {
					rv.push("-norhino");
				}
				return rv;
			})([])
		});
		jsh.shell.echo("Packaged at " + tmpfile);
		jsh.shell.java({
			jar: tmpfile,
			arguments: ["-classes", destination],
			environment: {
				JSH_LAUNCHER_DEBUG: "true"
			},
			evaluate: function(result) {
				if (result.status != 0) {
					throw new Error("Status from packaged addClasses.jsh.js: " + result.status);
				}
			}
		});
	}
	jsh.shell.echo("Scenario succeeded.");
	jsh.shell.exit(0);
}

if (!parameters.options.classes && !parameters.options.jar) {
	jsh.shell.console("No -classes or -jar argument.");
	jsh.shell.exit(1);
}

jsh.shell.echo("Rhino: " + ((jsh.shell.rhino) ? jsh.shell.rhino.classpath : null));
if (jsh.java.getClass("org.mozilla.javascript.Context")) {
	jsh.shell.echo("Rhino context: " + Packages.org.mozilla.javascript.Context.getCurrentContext());
}
jsh.shell.echo("Classes: " + parameters.options.classes);

var pass = true;

var verify = function(b,message) {
	if (!b) {
		pass = false;
	}
	if (message) {
		jsh.shell.echo(b + " " + message);
	}
}

var getClass = function(name) {
	return jsh.java.getClass(name);
}

var global = (function() { return this; })();

//	The below line causes the caching behavior of Packages to kick in, which makes the final verification (after adding the class)
//	to fail, at least under Rhino 1.7R2
verify(typeof(Packages.test.AddClasses) == "object", "typeof(Packages.test.AddClasses) == object");
verify(getClass("test.AddClasses") == null, "Class not found");
if (parameters.options.classes) {
	jsh.loader.java.add(parameters.options.classes);
} else if (parameters.options.jar) {
	if (parameters.options.search) {
		jsh.loader.plugins(parameters.options.jar.directory);
	} else {
		jsh.loader.plugins(parameters.options.jar.file);
	}
//	throw new Error("Unimplemented: JAR");
}
verify(getClass("test.AddClasses") != null, "Class found");
if (parameters.options["test:issue281"]) {
	jsh.shell.console("Running issue 281 tests ...");
	verify(typeof(Packages.test.AddClasses) == "function", "typeof(Packages.test.AddClasses) == function");
	verify(new Packages.test.AddClasses().toString() == "Loaded");
}
if (pass) {
	jsh.shell.exit(0);
} else {
	debugger;
	jsh.shell.exit(1);
}