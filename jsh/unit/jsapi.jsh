//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the jsh JavaScript/Java shell.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

var parameters = jsh.shell.getopts({
	options: {
		//	location of js/api project
		jsapi: jsh.file.Pathname,

		//	Directory to which we want to emit documentation; if missing, no documentation is emitted
		doc: jsh.file.Pathname,

		//	If true, do not run unit tests.
		notest: false,

		//	Add these pathnames to the script classpath
		classpath: jsh.shell.getopts.ARRAY( jsh.file.Pathname ),

		//	Set of name-value pairs separated by '='; name is a property name, value is a pathname to a file containing code.
		//	The code is executed into a scope and provided to the module APIs as $jsapi.environment[name]
		//	Alternately, a very simple version can be used without the '=': in this case, the entire argument will be interpreted
		//	as a name and $jsapi.environment[name] will be set to new Object().
		environment: jsh.shell.getopts.ARRAY( String ),

		//	TODO	documentation is out of date below; format is more complex now, involving namespace, path and location
		//	Sets of name-value pairs separated by '='; values are pathnames to modules.  Semantics of name differ between -use and
		//	-module; for -use, name is some sort of logical "path" that refers to the module; this path can be used by module APIs
		//	to execute modules they need to function.  For -module, name is a namespace in which the module is made available to the
		//	application environment for which we are generating the documentation.  It is optional; the module will be tested but
		//	not added to the documentation if it is absent.
		module: jsh.shell.getopts.ARRAY( String )
	}
	//	After options, also can include arguments in form of namespace=modulepath and they will be interpreted accordingly
});

if (!parameters.options.jsapi) {
	jsh.shell.echo("Missing: -jsapi");
	jsh.shell.exit(1);
} else if (!parameters.options.jsapi.directory) {
	jsh.shell.echo("Not a directory: -jsapi " + parameters.options.jsapi);
	jsh.shell.exit(1);
}

var modules = parameters.options.module.map( function(string) {
	var match = /^(.*)\@(.*)\=(.*)\:(.*)$/.exec(string);
	if (match == null) throw "No match: " + string;
	var rv = { path: match[2], location: jsh.file.Pathname(match[3]) };
	if (match[1]) rv.namespace = match[1];
	if (match[4]) rv.mode = match[4];
	return rv;
} );

var MODULES = (function() {
	var rv = {};
	modules.forEach(function(module) {
		rv[module.path] = module.location;
	} );
	return rv;
})();

parameters.options.classpath.forEach( function(pathname) {
	jsh.script.addClasses(pathname);
} );

var ENVIRONMENT = (function() {
	var rv = {};
	parameters.options.environment.forEach( function(item) {
		var tokens = item.split("=");
		if (tokens.length == 2) {
			var target = jsh.file.Pathname(tokens[1]);
			rv[tokens[0]] = jsh.loader.module(target);
		} else if (tokens.length == 1) {
			rv[item] = {};
		} else {
			throw "Bad -environment: " + item;
		}
	});
	return rv;
})();

var jsapi = jsh.loader.script(jsh.script.getRelativePath("jsapi.js"), {
	api: parameters.options.jsapi.directory,
	jsapi: {
		getFile: function(path) {
			return jsh.script.getRelativePath(path).file;
		}
	},
	Scenario: jsh.loader.script( parameters.options.jsapi.directory.getRelativePath("unit.before.js") ).Scenario,
	console: jsh.loader.script( jsh.script.getRelativePath("jsunit.after.js"), { verbose: true } ).console,
	MODULES: MODULES,
	ENVIRONMENT: ENVIRONMENT
});

if (!parameters.options.notest) {
	modules.forEach( function(module) {
		if (module.mode != "skip") {
			jsapi.tests.add(module.namespace,module.location);
		}
	} );
	var UNIT_TESTS_COMPLETED = function(success) {
		if (!success) {
			jsh.shell.exit(1);
		}
	}
	jsapi.tests.run(UNIT_TESTS_COMPLETED);
}

if (parameters.options.doc) {
	var list = [];
	modules.forEach( function(item) {
		list.push({ ns: item.namespace, path: item.path, location: item.location });
	} );
	jsapi.doc(list,parameters.options.doc);
}