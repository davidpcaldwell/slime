//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var tomcat = new jsh.httpd.Tomcat({
});

var map = function() {
	var script = jsh.script.script.getRelativePath("../../../rhino/http/servlet/test/manual/echo.servlet.js").file;
	tomcat.map({
		path: "/",
		servlets: {
			"/*": {
				file: script
			}
		}
	});
};

map();

jsh.shell.echo("Running Tomcat; process must be killed to exit.");
tomcat.run();
