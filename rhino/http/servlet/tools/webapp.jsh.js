//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

jsh.loader.plugins(jsh.script.file.parent.pathname);

var parameters = jsh.script.getopts({
	options: {
		to: jsh.file.Pathname,
		recursive: false,
		servletapi: (jsh.shell.jsh.lib.getSubdirectory("tomcat")) ? jsh.shell.jsh.lib.getRelativePath("tomcat/lib/servlet-api.jar") : jsh.file.Pathname,
		//	TODO	switch -library and -parameter to use new Object in jsh.script.getopts
		library: jsh.script.getopts.OBJECT(jsh.file.Pathname),
		compile: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		resources: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		norhino: false,
		//	TODO	allow multiple servlets with separate parameters
		servlet: String,
		parameter: jsh.script.getopts.OBJECT(String),
		"java:version": String
	}
});

var destination = (function() {
	if (!parameters.options.to) {
		jsh.shell.echo("Required: -to <pathname>");
		jsh.shell.exit(1);
	}

	if (/\.war$/.test(parameters.options.to)) {
		return {
			directory: jsh.shell.TMPDIR.createTemporary({ directory: true }),
			war: parameters.options.to
		};
	} else {
		return {
			directory: parameters.options.to.createDirectory({
				recursive: parameters.options.recursive,
				ifExists: function(dir) {
					dir.remove();
					return true;
				}
			})
		};
	}
})();

jsh.httpd.tools.build({
	destination: destination,
	rhino: !parameters.options.norhino,
	libraries: (function() {
		var rv = {};
		for (var x in parameters.options.library) {
			rv[x] = parameters.options.library[x].file;
		}
		return rv;
	})(),
	Resources: function() {
		parameters.options.resources.forEach(function(resources) {
			if (!resources.file) throw new Error("No file at " + resources);
			this.file(resources.file);
		},this);
	},
	compile: (function() {
		var args = [];
		parameters.options.compile.forEach(function(pathname) {
			args.push.apply(args,jsh.httpd.tools.build.getJavaSourceFiles(pathname));
		});
		return args;
	})(),
	servlet: parameters.options.servlet,
	parameters: parameters.options.parameter
});
