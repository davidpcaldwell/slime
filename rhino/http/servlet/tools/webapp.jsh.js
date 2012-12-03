//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		to: jsh.file.Pathname,
		servletapi: jsh.file.Pathname,
		resources: jsh.file.Pathname,
		norhino: false,
		servlet: String
	}
});

if (!parameters.options.to) {
	jsh.shell.echo("Required: -to <pathname>");
	jsh.shell.exit(1);
}

var WEBAPP = parameters.options.to.createDirectory({
	recursive: parameters.options.recursive,
	ifExists: function(dir) {
		dir.remove();
		return true;
	}
});

if (!parameters.options.norhino) {
	(function() {
		//	Get the path of Rhino in this shell, assume it is a file, and copy it to WEB-INF/lib
		var rhino = jsh.shell.java["class"].path.pathnames[0];
		rhino.file.copy(WEBAPP.getRelativePath("WEB-INF/lib").createDirectory({
			recursive: true
		}))
	})();
}

var SLIME = jsh.script.getRelativePath("../../../..").directory;

(function() {
	//	Compile the servlet to WEB-INF/classes
	var classpath = jsh.file.Searchpath([]);
	classpath.pathnames.push(WEBAPP.getRelativePath("WEB-INF/lib/js.jar"));
	classpath.pathnames.push(parameters.options.servletapi);
	var sourcepath = jsh.file.Searchpath([]);
	sourcepath.pathnames.push(SLIME.getRelativePath("rhino/system/java"));
	sourcepath.pathnames.push(SLIME.getRelativePath("loader/rhino/java"));
	jsh.java.tools.javac({
		destination: WEBAPP.getRelativePath("WEB-INF/classes"),
		classpath: classpath,
		sourcepath: sourcepath,
		arguments: [
			jsh.script.getRelativePath("../java/inonit/script/servlet/Servlet.java")
		],
		on: new function() {
			this.exit = function(p) {
				jsh.shell.echo("Exit status: " + p.status);
				if (p.status) {
					jsh.shell.echo(p.arguments);
				}
			}
		}
	});
})();

(function() {
	SLIME.getFile("loader/literal.js").copy(WEBAPP.getRelativePath("WEB-INF/loader.platform.js"));
	SLIME.getFile("loader/rhino/literal.js").copy(WEBAPP.getRelativePath("WEB-INF/loader.rhino.js"));
	SLIME.getFile("rhino/http/servlet/api.js").copy(WEBAPP.getRelativePath("WEB-INF/api.js"));
	SLIME.getFile("rhino/http/servlet/server.js").copy(WEBAPP.getRelativePath("WEB-INF/server.js"));
})();

if (parameters.options.resources) {
	jsh.loader.run(parameters.options.resources, {
		map: function(pathname,path) {
			var to = WEBAPP.getRelativePath(path);
			var node = (function() {
				if (pathname.file) return pathname.file;
				if (pathname.directory) return pathname.directory;
			})();
			node.copy(to, { recursive: true });		
		}
	});
}

(function() {
	var xml = SLIME.getFile("rhino/http/servlet/tools/web.xml").read(String);
	xml = xml.replace(/__SCRIPT__/, parameters.options.servlet);
	WEBAPP.getRelativePath("WEB-INF/web.xml").write(xml, { append: false });
})();