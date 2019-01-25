//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		directory: jsh.file.Pathname
	}
});

jsh.java.tools.plugin.git();

var name = parameters.options.directory.basename;

var server = new jsh.httpd.Tomcat();
server.map({
	path: "/",
	servlets: {
		"/*": {
			load: function(scope) {
				var backend = new jsh.unit.mock.git.Server({
					getLocation: function(path) {
						//jsh.shell.console("path = " + path + " basename = " + name);
						if (path.substring(0,name.length+1) == (name + "/")) {
							return parameters.options.directory.parent.directory.getRelativePath(path);
						}
					}
				});

				scope.$exports.handle = function(request) {
					//jsh.shell.console("Got request for " + request.path);
					return backend(request);
				}
			}
		}
	}
});
server.start();
if (false) {
	jsh.shell.console("Starting server on port " + server.port + " ...");
	server.run();
}

var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
var remote = new git.Repository({ remote: "http://127.0.0.1:" + server.port + "/" + parameters.options.directory.basename });
try {
	var local = remote.clone({ to: to.getRelativePath(name) });
	jsh.shell.console("Cloned to " + to.getRelativePath(name));
} finally {
	server.stop();
}
