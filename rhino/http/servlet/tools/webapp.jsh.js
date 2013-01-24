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

var SLIME = jsh.script.script.getRelativePath("../../../..").directory;

(function() {
	//	Compile the servlet to WEB-INF/classes
	var classpath = jsh.file.Searchpath([]);
	classpath.pathnames.push(WEBAPP.getRelativePath("WEB-INF/lib/js.jar"));
	classpath.pathnames.push(parameters.options.servletapi);
	var sourcepath = jsh.file.Searchpath([]);
	sourcepath.pathnames.push(SLIME.getRelativePath("rhino/system/java"));
	sourcepath.pathnames.push(SLIME.getRelativePath("loader/rhino/java"));
	sourcepath.pathnames.push(SLIME.getRelativePath("rhino/host/java"));
	jsh.java.tools.javac({
		destination: WEBAPP.getRelativePath("WEB-INF/classes"),
		classpath: classpath,
		sourcepath: sourcepath,
		arguments: [
			jsh.script.file.getRelativePath("../java/inonit/script/servlet/Servlet.java")
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

	SLIME.getSubdirectory("js/object").copy(WEBAPP.getRelativePath("WEB-INF/slime/js/object"), { recursive: true });
	SLIME.getSubdirectory("rhino/host").copy(WEBAPP.getRelativePath("WEB-INF/slime/rhino/host"), { recursive: true });
	SLIME.getSubdirectory("rhino/io").copy(WEBAPP.getRelativePath("WEB-INF/slime/rhino/io"), { recursive: true });
})();

if (parameters.options.resources) {
	//	Right now, we do not assume the plugin is installed, so we will "install" it.
	var resourcesPlugin = jsh.loader.file(SLIME.getRelativePath("rhino/http/servlet/resources.js"));
	var namespace = {
		io: jsh.io,
		loader: jsh.loader,
		shell: jsh.shell,
		httpd: {}
	};
	resourcesPlugin.addJshPluginTo(namespace);
	var resources = namespace.httpd.Resources.script(parameters.options.resources.file);
	resources.build(WEBAPP);
}

(function() {
	var xml = SLIME.getFile("rhino/http/servlet/tools/web.xml").read(String);
	xml = xml.replace(/__SCRIPT__/, parameters.options.servlet);
	//	The below line removes the license, because Tomcat cannot parse it; this may or may not be what we want
	xml = xml.substring(xml.indexOf("-->") + "-->".length + 1);
	WEBAPP.getRelativePath("WEB-INF/web.xml").write(xml, { append: false });
})();