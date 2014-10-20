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

plugin({
	isReady: function() {
		return jsh.java && jsh.java.log && jsh.io && jsh.io.mime && jsh.shell && jsh.file;
	},
	load: function() {
		if (!jsh.httpd) {
			jsh.httpd = {};
		}

		var getMimeType = $loader.file("jsh.mime.js", {
			jsh: jsh
		}).getMimeType;

		$loader.file("resources.jsh.file.js", {
			getMimeType: getMimeType
		}).addJshPluginTo(jsh);

		var CATALINA_HOME = (function() {
			if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
			if (jsh.shell.jsh.home && jsh.shell.jsh.home.getSubdirectory("lib/tomcat")) return jsh.shell.jsh.home.getSubdirectory("lib/tomcat");
		})();

		//	TODO	allow system property in addition to environment variable?
		$loader.module("jsh.tomcat.js", {
			jsh: jsh,
			CATALINA_HOME: CATALINA_HOME
		});
	}
});