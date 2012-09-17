//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
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
		//	See api.html for documentation of these options
		jsapi: jsh.file.Pathname,
		doc: jsh.file.Pathname,
		notest: false,
		classpath: jsh.shell.getopts.ARRAY( jsh.file.Pathname ),
		environment: jsh.shell.getopts.ARRAY( String ),
		base: jsh.file.Pathname,
		module: jsh.shell.getopts.ARRAY( String ),
		test: jsh.shell.getopts.ARRAY( String )
	}
});

if (!parameters.options.jsapi) {
	jsh.shell.echo("Missing: -jsapi");
	jsh.shell.exit(1);
} else if (!parameters.options.jsapi.directory) {
	jsh.shell.echo("Not a directory: -jsapi " + parameters.options.jsapi);
	jsh.shell.exit(1);
}

if (!parameters.options.base) {
	jsh.shell.echo("Missing: -base");
	jsh.shell.exit(1);
} else if (!parameters.options.base.directory) {
	jsh.shell.echo("Not a directory: -base " + parameters.options.base);
	jsh.shell.exit(1);
}

var modules = parameters.options.module.map( function(string) {
	var match = /^(.*)\@(.*)$/.exec(string);
	if (match == null) throw new Error("No match: " + string);
	//	TODO	some redundancy below which made adapting jsapi.js easier for now
	var rv = {
		base: parameters.options.base.directory,
		path: match[2],
		location: parameters.options.base.directory.getRelativePath(match[2])
	};
	if (match[1]) rv.namespace = match[1];
	return rv;
} );

var MODULES = (function() {
	var rv = {};
	modules.forEach(function(module) {
		rv[module.path] = module;
	} );
	return rv;
})();

parameters.options.classpath.forEach( function(pathname) {
	jsh.script.addClasses(pathname);
} );

debugger;

var ENVIRONMENT = (function() {
	var rv = {};
	parameters.options.environment.forEach( function(item) {
		var tokens = item.split("=");
		if (tokens.length == 2) {
			jsh.js.Object.expando.set(rv,tokens[0],jsh.loader.module(jsh.file.Pathname(tokens[1])));
		} else if (tokens.length == 1) {
			jsh.js.Object.expando.set(rv,item,{});
		} else {
			throw "Bad -environment: " + item;
		}
	});
	return rv;
})();

var jsapi = jsh.loader.file(jsh.script.getRelativePath("jsapi.js"), {
	api: parameters.options.jsapi.directory,
	html: jsh.loader.file( parameters.options.jsapi.directory.getRelativePath("api.html.js"), new function() {
		var seq = 0;

		this.run = function() {
			if (typeof(arguments[0]) == "string") {
				//	TODO	move this processing inside the jsh loader (or rhino loader?) so that it can be invoked with name/string
				//			properties. This code, after being moved to jsh loader, can then invoke rhino loader with name/_in
				//			created below then we would invoke jsh loader here with code = { name: ..., string: code }
				//	TODO	it seems likely a more useful name could be used here, perhaps using name of file plus jsapi:id path
				arguments[0] = {
					name: "<eval>:" + String(++seq),
					_in: (function() {
						var out = new Packages.java.io.ByteArrayOutputStream();
						var writer = new Packages.java.io.OutputStreamWriter(out);
						writer.write(arguments[0]);
						writer.flush();
						writer.close();
						return new Packages.java.io.ByteArrayInputStream(out.toByteArray());
					})()
				}
			}
			jsh.loader.run(arguments[0],arguments[1]);
		}
	} ),
	jsapi: {
		getFile: function(path) {
			return jsh.script.getRelativePath(path).file;
		}
	},
	Scenario: jsh.loader.file( parameters.options.jsapi.directory.getRelativePath("unit.before.js") ).Scenario,
	console: jsh.loader.file( jsh.script.getRelativePath("jsunit.after.js"), {
		console: {
			println: function(s) {
				if (arguments.length == 0) {
					Packages.java.lang.System.out.println();
				} else {
					Packages.java.lang.System.out.println(s);
				}
			},
			print: function(s) {
				Packages.java.lang.System.out.print(s);
				Packages.java.lang.System.out.flush();
			}
		},
		verbose: true
	} ).console,
	MODULES: MODULES,
	ENVIRONMENT: ENVIRONMENT
});

if (!parameters.options.notest) {
	if (parameters.options.test.length) {
		parameters.options.test.forEach( function(test) {
			var getModule = function(path) {
				if (MODULES[path+"/"]) return MODULES[path+"/"];
				if (!MODULES[path]) throw new Error("Module not found: " + path + " (available: " + Object.keys(MODULES) + ")");
				return MODULES[path];
			}


			var tokens = test.split(":");
			if (tokens.length == 1) {
				jsapi.tests.add(getModule(test));
			} else {
				jsapi.tests.add(getModule(tokens[0]),tokens.slice(1).join("."));
			}
		});
	} else {
		modules.forEach( function(module) {
			jsapi.tests.add(module);
		});
	}
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
		list.push({ ns: item.namespace, base: item.base, path: item.path, location: item.location });
	} );
	jsapi.doc({
		modules: list,
		to: parameters.options.doc
	});
}