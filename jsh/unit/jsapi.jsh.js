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

var parameters = jsh.script.getopts({
	options: {
		//	See api.html for documentation of these options
		jsapi: jsh.script.file.getRelativePath("../../loader/api"),

		api: jsh.script.getopts.ARRAY( jsh.file.Pathname ),
		test: jsh.script.getopts.ARRAY( String ),

		notest: false,
		classpath: jsh.script.getopts.ARRAY( jsh.file.Pathname ),
		environment: jsh.script.getopts.ARRAY( String ),

		doc: jsh.file.Pathname,
		index: jsh.file.Pathname,
		view: "console"
	}
});

jsh.loader.plugins(parameters.options.jsapi);
jsh.loader.plugins(jsh.script.file.parent.pathname);

if (!parameters.options.jsapi.directory) {
	jsh.shell.echo("Not a directory: -jsapi " + parameters.options.jsapi);
	jsh.shell.exit(1);
}

var getRelativePath = function(pathname) {
	var pwd = jsh.script.file.parent.parent.parent.toString();
	var indexpath = pathname.toString();
	if (indexpath.substring(0,pwd.length) == pwd) {
		return indexpath.substring(pwd.length);
	} else {
		return null;
	}
};

var modules = parameters.options.api.map( function(pathname) {
	//	TODO	some redundancy below which made adapting jsapi.js easier for now
	var rv = {
		//	TODO	refactor need for this out by moving calculation of relative path here
		base: jsh.shell.PWD,
		path: getRelativePath(pathname),
		location: pathname
	};
	return rv;
} );

if (!parameters.options.notest) {
	parameters.options.classpath.forEach( function(pathname) {
		jsh.loader.java.add(pathname);
	} );

	var ENVIRONMENT = (function() {
		var rv = {};
		parameters.options.environment.forEach( function(item) {
			if (item.split("=").length == 2) {
				//	Interpret as assignment of string property to environment
				var tokens = item.split("=");
				jsh.shell.echo("Setting environment value " + tokens[0] + " to '" + tokens[1] + "'");
				jsh.js.Object.expando.set(rv,tokens[0],tokens[1]);
			} else if (item.split(":").length > 1) {
				//	Interpret as path to module
				var coloned = item.split(":");
				var pathname = jsh.file.Pathname(coloned.slice(1).join(":"));
				jsh.shell.echo("Loading environment value " + coloned[0] + " from " + pathname);
				jsh.js.Object.expando.set(rv,coloned[0],jsh.loader.module(pathname));
			} else {
				jsh.shell.echo("Setting environment value " + item);
				jsh.js.Object.expando.set(rv,item,{});
			}
		});
		return rv;
	})();

	jsh.unit.Scenario.Html = (function(was) {
		return function(p) {
			return was.call(this,jsh.js.Object.set({}, p, { suite: true }));
		}
	})(jsh.unit.Scenario.Html);
	var tests = new jsh.unit.Suite();
	jsh.unit.view.options.select(parameters.options.view).listen(tests);
	tests.add = function(p) {
		if (typeof(arguments.callee.id) == "undefined") arguments.callee.id = 0;
		arguments.callee.id++;
		this.suite(String(arguments.callee.id),p.scenario);
	}

	//tests.environment(ENVIRONMENT);

	modules.forEach( function(module) {
		tests.add({ scenario: new jsh.unit.Scenario.Html({ pathname: module.location, environment: ENVIRONMENT }) });
	});

	parameters.options.test.forEach( function(test) {
		var getModule = function(path) {
			return {
				location: jsh.file.Pathname(path)
			}
		};

		var tokens = test.split(":");
		var pathname = (tokens.length == 1) ? getModule(test).location : getModule(tokens[0]).location;
		//	TODO	unit argument may be obsolete? Or how do we run subsets of suites now?
		var unit = (tokens.length == 1) ? void(0) : tokens.slice(1).join(".");
		var environment = jsh.js.Object.set({}, ENVIRONMENT, { file: pathname.file });
		tests.add({ scenario: new jsh.unit.Scenario.Html({ pathname: pathname, unit: unit, environment: environment }) });
//		if (tokens.length == 1) {
//			tests.add({ scenario: new jsh.unit.Scenario.Html({ pathname: getModule(test).location, environment: ENVIRONMENT }) });
//		} else {
//			tests.add({ scenario: new jsh.unit.Scenario.Html({ pathname: getModule(tokens[0]).location, unit: tokens.slice(1).join("."), environment: ENVIRONMENT }) });
//		}
	});
	var UNIT_TESTS_COMPLETED = function(success) {
		if (!success) {
			//	TODO	make the below a polymorphic method on view
			if (parameters.options.view != "webview") {
				jsh.shell.echo("Tests failed; exiting with status 1.", { stream: jsh.shell.stdio.error });
				jsh.shell.exit(1);
			}
		} else {
			jsh.shell.echo("Tests passed.");
		}
	}
	try {
		UNIT_TESTS_COMPLETED(tests.run());
	} catch (e) {
		var console = function(s) {
			jsh.shell.echo(s, { stream: jsh.shell.stdio.error });
		};
		console("Error thrown.");
		if (e.code) {
			console("Code: " + e.code);
		}
		if (e.stack) {
			console(e);
			console(e.stack);
		}
		if (e.cause) {
			console("Cause: " + e.cause.message);
			console(e.stack);
		}
		throw e;
	}
}

if (parameters.options.doc) {
	//	TODO	this style of documentation appears near obsolete, but this is still used in jsh/etc/build.jsh.js
	var relative = (function() {
		if (!parameters.options.index || !parameters.options.index.file) {
			return null;
		}
		return getRelativePath(parameters.options.index);
	})();
	jsh.unit.html.documentation({
		index: (parameters.options.index) ? parameters.options.index.file : null,
		//	TODO	not platform-independent
		prefix: (relative) ? new Array(relative.split("/").length).join("../") : null,
		modules: modules,
		to: parameters.options.doc,
		getPath: function(pathname) {
			if (pathname === null) throw new Error("null pathname!");
			return getRelativePath(pathname);
		}
	});
}