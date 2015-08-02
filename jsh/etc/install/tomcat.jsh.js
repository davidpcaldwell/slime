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

var getLatestVersion = function() {
	try {
		var downloadRawHtml = new jsh.http.Client().request({
			url: "http://tomcat.apache.org/download-70.cgi",
			evaluate: function(result) {
				return result.body.stream.character().asString()
			}
		});
		var matcher = /\<h3 id=\"(7\..*)\"\>/;
		var match = matcher.exec(downloadRawHtml);
		var version = match[1];
		return version;
	} catch (e) {
		jsh.shell.echo("Could not get latest Tomcat 7 version from tomcat.apache.org (offline?) ...");
		//	TODO	probably should implement some sort of jsh.shell.user.downloads
		if (jsh.shell.environment.JSH_BUILD_DOWNLOADS) {
			jsh.shell.echo("Checking downloads at " + jsh.shell.environment.JSH_BUILD_DOWNLOADS + " ...");
			var downloads = jsh.file.Pathname(jsh.shell.environment.JSH_BUILD_DOWNLOADS).directory;
			var pattern = arguments.callee.pattern;
			var local = downloads.list().filter(function(node) {
				return !node.directory && pattern.test(node.pathname.basename);
			});
			if (local.length) {
				var getVersion = function(node) {
					var name = node.pathname.basename;
					var match = pattern.exec(name);
					return Number(match[1])*10000 + Number(match[2])*100 + Number(match[3]);
				};

				var getVersionString = function(node) {
					var match = pattern.exec(node.pathname.basename);
					return match[1] + "." + match[2] + "." + match[3]
				}

				local.forEach(function(node) {
					jsh.shell.echo("Found version " + getVersionString(node));
				})

				local.sort(function(a,b) {
					return getVersion(b) - getVersion(a);
				});

				jsh.shell.echo("Latest version is " + getVersionString(local[0]));
				return getVersionString(local[0]);
			}
		}
	}
}
getLatestVersion.pattern = /^apache-tomcat-(\d+)\.(\d+)\.(\d+)\.zip$/;

var parameters = jsh.script.getopts({
	options: {
		version: String,
		local: jsh.file.Pathname
	}
});

if (!parameters.options.local) {
	if (!parameters.options.version) {
		parameters.options.version = getLatestVersion();
	}

	if (!parameters.options.version) {
		jsh.shell.echo("Could not determine latest Tomcat 7 version; not installing.");
		jsh.shell.exit(1);
	}

	var api = jsh.script.loader.file("api.js");
	var apache = jsh.script.loader.file("apache.js", { api: api });

	var zip = apache.download({
		path: "tomcat/tomcat-7/v" + parameters.options.version + "/bin/apache-tomcat-" + parameters.options.version + ".zip"
	});
	parameters.options.local = zip.pathname;
} else {
	if (!parameters.options.version) {
		if (!parameters.options.local.file) {
			jsh.shell.echo("Not found: " + parameters.options.local);
			jsh.shell.exit(1);
		}
		var match = getLatestVersion.pattern.exec(parameters.options.local.basename);
		if (match) {
			parameters.options.version = match[1] + "." + match[2] + "." + match[3];
		} else {
			jsh.shell.echo("Unable to determine version from filename: " + parameters.options.local);
			jsh.shell.exit(1);
		}
	}
}
var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
jsh.shell.echo("Unzipping to: " + to);
jsh.file.unzip({
	zip: parameters.options.local.file,
	to: to
});
var destination = jsh.shell.jsh.lib.getRelativePath("tomcat");
jsh.shell.echo("Installing Tomcat at " + destination);
to.getSubdirectory("apache-tomcat-" + parameters.options.version).move(destination, { overwrite: true });