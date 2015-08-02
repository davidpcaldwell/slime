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

//	TODO	clean up the plugin; rename plugin.jsh.api.html and include jsh.tomcat.js in this file or one with a better name
plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.java.log && jsh.io && jsh.io.mime && jsh.shell && jsh.file;
	},
	load: function() {
		if (!jsh.httpd) {
			jsh.httpd = {};
		}

		var getMimeType = $loader.file("jsh.mime.js", {
			jsh: jsh
		}).getMimeType;

		jsh.httpd.nugget = {};
		jsh.httpd.nugget.getMimeType = getMimeType;

		$loader.file("resources.jsh.file.js", {
			getMimeType: getMimeType
		}).addJshPluginTo(jsh);

		var CATALINA_HOME = (function() {
			if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
			if (jsh.shell.jsh.lib && jsh.shell.jsh.lib.getSubdirectory("tomcat")) return jsh.shell.jsh.lib.getSubdirectory("tomcat");
		})();

		//	TODO	allow system property in addition to environment variable?
		$loader.module("jsh.tomcat.js", {
			$java: $jsh,
			jsh: jsh,
			CATALINA_HOME: CATALINA_HOME
		});

		if (jsh.httpd.Tomcat) {
			jsh.httpd.Tomcat.serve = function(p) {
				var loader = new jsh.file.Loader({ directory: p.directory });
				var getMimeType = function(path) {
					return jsh.httpd.nugget.getMimeType(p.directory.getFile(path));
				}
				var tomcat = new jsh.httpd.Tomcat(p);
				tomcat.map({
					path: "",
					servlets: {
						"/*": {
							load: function(scope) {
								scope.$exports.handle = function(request) {
									var resource = loader.resource(request.path);
									if (resource) {
										return {
											status: {
												code: 200
											},
											headers: [],
											body: {
												type: getMimeType(request.path),
												stream: resource.read(jsh.io.Streams.binary)
											}
										};
									} else {
										return {
											status: {
												code: 404
											}
										}
									}
								};
							}
						}
					}
				});
				tomcat.start();
				return tomcat;
			};
		}
	}
});