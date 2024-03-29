//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(function() {
	var parameters = jsh.script.getopts({
		options: {
			base: jsh.file.Pathname,
			port: Number,
			webapp: jsh.file.Pathname
		}
	});

	var base = (parameters.options.base) ? parameters.options.base.createDirectory({
		ifExists: function(dir) {
			return false;
		}
	}) : null;

	debugger;
	try {
		var targetClass = jsh.loader.getClass("org.apache.catalina.deploy.ServletDef");
	} catch (e) {
		var error = e;
		debugger;
	}

	var tomcat = new jsh.httpd.Tomcat({
		base: base,
		port: parameters.options.port
	});
	jsh.shell.echo("Base: " + tomcat.base);
	jsh.shell.echo("Port: " + tomcat.port);
	tomcat.map({
		path: "",
		webapp: parameters.options.webapp
	});
	tomcat.run();
})();
