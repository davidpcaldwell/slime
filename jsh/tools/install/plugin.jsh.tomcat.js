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
		jsh.shell.console("Latest Tomcat version from tomcat.apache.org is " + version);
		return version;
	} catch (e) {
		jsh.shell.console("Could not get latest Tomcat 7 version from tomcat.apache.org (offline?) ...");
		//	TODO	probably should implement some sort of jsh.shell.user.downloads
		if (jsh.shell.user.downloads) {
			jsh.shell.console("Checking downloads at " + jsh.shell.user.downloads + " ...");
			var downloads = jsh.shell.user.downloads;
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
					jsh.shell.console("Found local version " + getVersionString(node));
				})

				local.sort(function(a,b) {
					return getVersion(b) - getVersion(a);
				});

				jsh.shell.console("Latest local version is " + getVersionString(local[0]));
				var error = new Error("Obtained latest local version: " + getVersionString(local[0]));
				error.version = getVersionString(local[0]);
				throw error;
			}
		}
	}
}
getLatestVersion.pattern = /^apache-tomcat-(\d+)\.(\d+)\.(\d+)\.zip$/;

var Version = function(s) {
	this.toString = function() {
		return s;
	}
};

$exports.installed = function(p) {
	if (!p) p = {};
	var notes = (function() {
		if (p.mock && p.mock.notes) return p.mock.notes;
		var home = (typeof(p.home) != "undefined") ? p.home : jsh.shell.jsh.lib.getSubdirectory("tomcat");
		if (!home) return null;
		return home.getFile("RELEASE-NOTES");
	})();
	if (!notes) return null;
	var lines = notes.read(String).split("\n");
	var rv;
	lines.forEach(function(line) {
		if (rv) return;
		var matcher = /(?:\s*)Apache Tomcat Version (\d+\.\d+\.\d+)(?:\s*)/;
		var match = matcher.exec(line);
		if (match) {
			rv = { version: new Version(match[1]) };
		}
	});
	return rv;
}

$exports.install = $context.$api.Events.Function(function(p,events) {
	if (!p) p = {};

	var lib = (p.mock && p.mock.lib) ? p.mock.lib : jsh.shell.jsh.lib;
	var getLatest = (p.mock && p.mock.getLatestVersion) ? p.mock.getLatestVersion : getLatestVersion;
	var findApache = (p.mock && p.mock.findApache) ? p.mock.findApache : jsh.tools.install.apache.find;

	if (!p.to) {
		p.to = lib.getRelativePath("tomcat");
	}

	if (p.to.directory && !p.replace) {
		events.fire("console", "Tomcat already installed at " + p.to.directory);
		return;
	}

	if (!p.local) {
		var mirror = (p.version) ? "https://archive.apache.org/dist/" : void(0);
		if (!p.version) {
			//	Check tomcat.apache.org; if unreachable, assume latest version is latest in downloads directory
			try {
				p.version = getLatest();
				if (!p.version) {
					throw new Error("Could not determine latest Tomcat 7 version; not installing.");
				}
			} catch (e) {
				if (e.version) {
					p.version = e.version;
				} else {
					throw e;
				}
			}
		} else {
			events.fire("console","Installing specified version " + p.version);
		}
		p.local = findApache({
			mirror: mirror,
			path: "tomcat/tomcat-7/v" + p.version + "/bin/apache-tomcat-" + p.version + ".zip"
		});
	} else {
		if (!p.version) {
			//	TODO	we do not check to see whether this file actually is the desired version
			var match = getLatestVersion.pattern.exec(p.local.pathname.basename);
			if (match) {
				p.version = match[1] + "." + match[2] + "." + match[3];
				events.fire("console","Installing version " + p.version + " determined from local filename.");
			} else {
				throw new Error("Unable to determine version from filename: " + p.local);
			}
		}
	}
	var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
	events.fire("console","Unzipping " + p.local + " to: " + to);
	jsh.file.unzip({
		zip: p.local,
		to: to
	});
	events.fire("console","Installing Tomcat at " + p.to);
	to.getSubdirectory("apache-tomcat-" + p.version).move(p.to, { overwrite: true });
	events.fire("installed", { to: p.to });
}, {
	console: function(e) {
		jsh.shell.console(e.detail);
	}
});

$exports.require = $api.Events.Function(function(p,events) {
	jsh.shell.jsh.require({
		satisfied: function() { return $exports.installed(); },
		install: function() { return $exports.install(p,events); }
	});
});
