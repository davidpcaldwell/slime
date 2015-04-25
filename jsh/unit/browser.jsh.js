//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
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
		interactive: false,
		port: Number,
		ie: false,
		safari: false,
		firefox: false,
		chrome: false,
		browser: jsh.script.getopts.OBJECT(jsh.file.Pathname),
		coffeescript: jsh.file.Pathname
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!jsh.httpd || !jsh.httpd.Tomcat) {
	jsh.shell.stderr.write("Cannot run browser tests; Tomcat not present.\n");
	jsh.shell.exit(1);
}

if (!jsh.java.Thread) {
	jsh.shell.echo("Cannot run browser tests; jsh.java.Thread not implemented; use Rhino, not Nashorn", { stream: jsh.shell.stderr });
	jsh.shell.exit(1);
}

var browsers = (function() {
	var useSpecificBrowsers = (
		parameters.options.ie || parameters.options.safari || parameters.options.firefox || parameters.options.chrome
		|| Object.keys(parameters.options.browser).length
	);

	var rv = [];

	["IE","Safari","Firefox","Chrome"].forEach(function(name) {
		var property = name.toLowerCase();
		if (!useSpecificBrowsers || parameters.options[property]) {
			var pathname = parameters.options.browser[property];
			if (pathname) {
				rv.push(new jsh.unit.browser[name]({ program: pathname.file }));
			} else if (jsh.unit.browser.installed[property]) {
				rv.push(jsh.unit.browser.installed[property]);
			}
		}
	});

	return rv;
})();

var modules = parameters.arguments.map(function(argument) { return jsh.file.Pathname(argument); });
jsh.shell.echo("Running " + modules.length + " browser unit tests ...");
jsh.shell.echo(modules.map(function(object) { return object; }).join(" "));

var MODULES = (modules.length) ? new jsh.unit.browser.Modules(jsh.script.file.parent.parent.parent,modules) : null;
jsh.shell.echo("browsers = " + browsers);
if (MODULES && browsers.length) {
	//	TODO	handle zero modules or zero browsers more intelligently
	try {
		var scenario = new jsh.unit.Scenario({ composite: true, name: "Browser tests" });
		browsers.forEach(function(browser) {
			scenario.add({
				scenario: MODULES.test({
					coffeescript: parameters.options.coffeescript,
					port: parameters.options.port,
					browser: browser,
					interactive: parameters.options.interactive
				})
			});
		});
		var rv = scenario.run({
			console: new jsh.unit.console.Stream({
				writer: jsh.shell.stdio.output
			})
		});
		if (rv) {
			jsh.shell.echo("Tests in all browsers: " + "[" + browsers.map(function(browser) { return browser.name; }).join(", ") + "]" + " succeeded.");
			jsh.shell.exit(0);
		} else {
			jsh.shell.echo("Tests failed.");
			jsh.shell.exit(1);
		}
	} catch (e) {
		if (e.rhinoException) {
			e.rhinoException.printStackTrace();
		}
		if (e.javaException) {
			e.javaException.printStackTrace();
		}
		if (!e.rhinoException && !e.javaException && e.stack) {
			Packages.java.lang.System.err.println(e.stack);
		}
		throw e;
	}
} else {
	if (!MODULES) {
		jsh.shell.echo("No modules to run.");
	}
	if (!browsers.length) {
		jsh.shell.echo("No browsers selected.");
	}
	jsh.shell.exit(1);
}