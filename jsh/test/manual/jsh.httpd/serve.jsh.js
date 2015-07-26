//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		port: Number,
		directory: jsh.script.file.parent.parent.parent.parent.parent.pathname
	}
});

var tomcat = jsh.httpd.Tomcat.serve({
	port: parameters.options.port,
	directory: parameters.options.directory.directory
});
jsh.shell.echo("Tomcat started on port " + tomcat.port);
tomcat.run();


