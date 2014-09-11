//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		version: "7.0.55",
		jsh: (function() {
			if (jsh.shell.jsh.home) return jsh.shell.jsh.home.pathname;
			return jsh.file.Pathname;
		})(),
		download: jsh.file.Pathname
	}
});

var api = jsh.script.loader.file("api.js");
var apache = jsh.script.loader.file("apache.js", { api: api });

var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
var zip = apache.download({
	path: "tomcat/tomcat-7/v" + parameters.options.version + "/bin/apache-tomcat-" + parameters.options.version + ".zip"
});
jsh.shell.echo("Unzipping to: " + to);
jsh.file.unzip({
	zip: zip,
	to: to
});
var destination = parameters.options.jsh.directory.getRelativePath("lib/tomcat");
jsh.shell.echo("Installing Tomcat at " + destination);
to.getSubdirectory("apache-tomcat-" + parameters.options.version).move(destination, { overwrite: true });
