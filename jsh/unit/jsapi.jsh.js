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

var views = {
	console: function() {
		return new jsh.unit.view.Console( { writer: jsh.shell.stdio.output } );
	},
	stdio: function() {
		return new jsh.unit.view.Events({ writer: jsh.shell.stdio.output })
	},
	webview: function() {
		return new jsh.unit.view.WebView();
	}
}

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

var console = views[parameters.options.view]();

//var jsapi = jsh.loader.file(jsh.script.file.getRelativePath("html.js"), {
//	api: parameters.options.jsapi.directory,
//	html: jsh.unit.html,
//	Scenario: jsh.unit.Scenario//jsh.loader.file( parameters.options.jsapi.directory.getRelativePath("unit.js") ).Scenario,
//});
//var jsapi = jsh.unit.html;

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

	var tests = new jsh.unit.Scenario({
		composite: true,
		name: "jsapi.jsh.js unit tests",
		view: console
	});

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
		if (tokens.length == 1) {
			tests.add({ scenario: new jsh.unit.Scenario.Html({ pathname: getModule(test).location, environment: ENVIRONMENT }) });
		} else {
			tests.add({ scenario: new jsh.unit.Scenario.Html({ pathname: getModule(tokens[0]).location, unit: tokens.slice(1).join("."), environment: ENVIRONMENT }) });
		}
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
	UNIT_TESTS_COMPLETED(tests.run());
}

if (parameters.options.doc) {
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
			return getRelativePath(pathname);
		}
	});
}