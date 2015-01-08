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

var parameters = jsh.script.getopts({
	options: {
		to: jsh.file.Pathname,
		recursive: false,
		servletapi: (jsh.shell.jsh.home) ? jsh.shell.jsh.home.getRelativePath("lib/tomcat/lib/servlet-api.jar") : jsh.file.Pathname,
		//	TODO	switch -library and -parameter to use new Object in jsh.script.getopts
		library: jsh.script.getopts.ARRAY(String),
		compile: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		resources: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		norhino: false,
		//	TODO	allow multiple servlets with separate parameters
		servlet: String,
		parameter: jsh.script.getopts.ARRAY(String),
		"java:version": String
	}
});

if (!parameters.options.to) {
	jsh.shell.echo("Required: -to <pathname>");
	jsh.shell.exit(1);
}

var destination = (function() {
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

var WEBAPP = destination.directory;

WEBAPP.getRelativePath("WEB-INF").createDirectory();
if (!parameters.options.norhino) {
	(function() {
		//	Get the path of Rhino in this shell, assume it is a file, and copy it to WEB-INF/lib
		if (jsh.shell.rhino) {
			if (jsh.shell.rhino.classpath.pathnames.length == 1) {
				var rhino = jsh.shell.rhino.classpath.pathnames[0];
				if (/\.jar$/.test(rhino.basename)) {
					var destination = WEBAPP.getRelativePath("WEB-INF/lib").createDirectory();
					rhino.file.copy(destination.getRelativePath("js.jar"));
				} else {
					throw new Error("Rhino not present; classpath=" + jsh.shell.rhino.classpath);
				}
			} else {
				throw new Error("Could not locate Rhino in classpath " + jsh.shell.rhino.classpath);
			}
		} else {
			throw new Error("Rhino not present.");
		}
	})();
}
parameters.options.library.forEach(function(declaration) {
	var tokens = declaration.split("=");
	var lib = WEBAPP.getRelativePath("WEB-INF/lib").createDirectory({
		ifExists: function(dir) {
			return false;
		}
	});
	jsh.file.Pathname(tokens[1]).file.copy(lib.getRelativePath(tokens[0]), { recursive: true });
});

var SLIME = jsh.script.script.getRelativePath("../../../..").directory;

(function() {
	var args = [];
	parameters.options.compile.forEach(function(pathname) {
		if (pathname.directory) {
			var pathnames = pathname.directory.list({
				recursive: true,
				type: pathname.directory.list.ENTRY
			}).filter(function(entry) {
				return /\.java/.test(entry.node.pathname.basename);
			}).map(function(entry) {
				return entry.node.pathname;
			});
			args = args.concat(pathnames);
		} else {
			args.push(pathname);
		}
	});

	//	Compile the servlet to WEB-INF/classes
	var classpath = jsh.file.Searchpath([]);
	classpath.pathnames.push(WEBAPP.getRelativePath("WEB-INF/lib/js.jar"));
	classpath.pathnames.push(parameters.options.servletapi);
	var sourcepath = jsh.file.Searchpath([]);
	sourcepath.pathnames.push(SLIME.getRelativePath("rhino/system/java"));
	sourcepath.pathnames.push(SLIME.getRelativePath("loader/rhino/java"));
	sourcepath.pathnames.push(SLIME.getRelativePath("loader/rhino/rhino/java"));
	sourcepath.pathnames.push(SLIME.getRelativePath("rhino/host/java"));
	if (!parameters.options.norhino) {
		sourcepath.pathnames.push(SLIME.getRelativePath("rhino/host/rhino/java"));
	}
	sourcepath.pathnames.push(SLIME.getRelativePath("rhino/http/servlet/java"));
	if (!parameters.options.norhino) {
		sourcepath.pathnames.push(SLIME.getRelativePath("rhino/http/servlet/rhino/java"));
	}
	var sources = [
		jsh.script.file.getRelativePath("../java/inonit/script/servlet/Servlet.java"),
		jsh.script.file.getRelativePath("../java/inonit/script/servlet/Nashorn.java")
	];
	if (!parameters.options.norhino) {
		sources.push(
			jsh.script.file.getRelativePath("../rhino/java/inonit/script/servlet/Rhino.java")
		);
	}
	jsh.java.tools.javac({
		destination: WEBAPP.getRelativePath("WEB-INF/classes"),
		classpath: classpath,
		sourcepath: sourcepath,
		source: (parameters.options["java:version"]) ? parameters.options["java:version"] : null,
		target: (parameters.options["java:version"]) ? parameters.options["java:version"] : null,
		arguments: sources.concat(args),
		on: new function() {
			this.exit = function(p) {
				jsh.shell.echo("Exit status of javac: " + p.status);
				if (p.status) {
					jsh.shell.echo("Compilation failure for arguments: " + p.arguments);
				}
			}
		}
	});
})();

(function() {
	SLIME.getSubdirectory("loader").list().forEach(function(node) {
		if (!node.directory) {
			node.copy(WEBAPP.getRelativePath("WEB-INF/loader/" + node.pathname.basename), { recursive: true });
		}
	});
//	SLIME.getFile("loader/literal.js").copy(WEBAPP.getRelativePath("WEB-INF/loader/literal.js"));
//	SLIME.getFile("loader/api.js").copy(WEBAPP.getRelativePath("WEB-INF/loader/api.js"));
	SLIME.getSubdirectory("loader/rhino").list().forEach(function(node) {
		if (/\.js$/.test(node.pathname.basename)) {
			node.copy(WEBAPP.getRelativePath("WEB-INF/loader/rhino/" + node.pathname.basename), { recursive: true });
		}
	});
//	SLIME.getFile("loader/rhino/literal.js").copy(WEBAPP.getRelativePath("WEB-INF/loader/rhino/literal.js"), { recursive: true });
	SLIME.getFile("rhino/http/servlet/api.js").copy(WEBAPP.getRelativePath("WEB-INF/api.js"));
	SLIME.getFile("rhino/http/servlet/server.js").copy(WEBAPP.getRelativePath("WEB-INF/server.js"));

	["js/debug","js/object","js/mime","rhino/host","rhino/io"].forEach(function(path) {
		SLIME.getSubdirectory(path).copy(WEBAPP.getRelativePath("WEB-INF/slime/" + path), { recursive: true });
	});
})();

parameters.options.resources.forEach(function(resources) {
	jsh.httpd.Resources.script(resources.file).build(WEBAPP);
});

(function() {
	//	Obviously using an XML parser would be beneficial here if this begins to get more complex

	var xml = SLIME.getFile("rhino/http/servlet/tools/web.xml").read(String);
	xml = xml.replace(/__SCRIPT__/, parameters.options.servlet);
	//	The below line removes the license, because Tomcat cannot parse it; this may or may not be what we want
	xml = xml.substring(xml.indexOf("-->") + "-->".length + 1);

	var nextInitParamIndex;
	var lines = xml.split("\n");
	for (var i=0; i<lines.length; i++) {
		if (/\<\/init-param\>/.test(lines[i])) {
			nextInitParamIndex = i+1;
		}
	}
	var initParamLines = [];
	parameters.options.parameter.forEach(function(parameter) {
		var tokens = parameter.split("=");
		initParamLines = initParamLines.concat([
			"\t\t<init-param>",
			"\t\t\t<param-name>" + tokens[0] + "</param-name>",
			"\t\t\t<param-value>" + tokens[1] + "</param-value>",
			"\t\t</init-param>"
		]);
	});
	var spliceArgs = [nextInitParamIndex,0].concat(initParamLines);
	lines.splice.apply(lines,spliceArgs);
	xml = lines.join("\n");

	WEBAPP.getRelativePath("WEB-INF/web.xml").write(xml, { append: false });
})();

if (destination.war) {
	jsh.file.zip({
		from: destination.directory.pathname,
		to: destination.war
	});
}