//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.shell.tools.internal.tomcat.Context } $context
	 * @param { slime.jsh.shell.tools.internal.tomcat.Exports } $exports
	 */
	function($api,$context,$exports) {
		var jsh = $context.jsh;
		if (!jsh) throw new TypeError("No jsh.");

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
				if (version.indexOf("\"") != -1) {
					version = version.substring(0, version.indexOf("\""));
				}
				jsh.shell.console("Latest Tomcat version from tomcat.apache.org is " + version);
				//	Work around issue manifested 2020-02-14 regarding version
				if (version.indexOf("\"") != -1) {
					jsh.shell.console("html = [" + downloadRawHtml + "]");
					version = version.substring(0,version.indexOf("\""));
				}
				return version;
			} catch (e) {
				//	Tomcat 7 EOL; apparently last version
				return "7.0.109";
				// jsh.shell.console("Could not get latest Tomcat 7 version from tomcat.apache.org (offline?) ...");
				// //	TODO	probably should implement some sort of jsh.shell.user.downloads
				// if (jsh.shell.user.downloads) {
				// 	jsh.shell.console("Checking downloads at " + jsh.shell.user.downloads + " ...");
				// 	var downloads = jsh.shell.user.downloads;
				// 	var pattern = arguments.callee.pattern;
				// 	var local = downloads.list().filter(function(node) {
				// 		return !node.directory && pattern.test(node.pathname.basename);
				// 	});
				// 	if (local.length) {
				// 		var getVersion = function(node) {
				// 			var name = node.pathname.basename;
				// 			var match = pattern.exec(name);
				// 			return Number(match[1])*10000 + Number(match[2])*100 + Number(match[3]);
				// 		};

				// 		var getVersionString = function(node) {
				// 			var match = pattern.exec(node.pathname.basename);
				// 			return match[1] + "." + match[2] + "." + match[3]
				// 		}

				// 		local.forEach(function(node) {
				// 			jsh.shell.console("Found local version " + getVersionString(node));
				// 		})

				// 		local.sort(function(a,b) {
				// 			return getVersion(b) - getVersion(a);
				// 		});

				// 		jsh.shell.console("Latest local version is " + getVersionString(local[0]));
				// 		var error = new Error("Obtained latest local version: " + getVersionString(local[0]));
				// 		error.version = getVersionString(local[0]);
				// 		throw error;
				// 	}
				// }
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
				var home = (typeof(p.home) != "undefined") ? p.home : jsh.shell.jsh.lib.getRelativePath("tomcat");
				if (!home) return null;
				return home.directory.getFile("RELEASE-NOTES");
			})();
			if (!notes) return null;
			var lines = notes.read(String).split("\n");
			var rv = null;
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

		/**
		 *
		 * @param { Parameters<slime.jsh.shell.tools.internal.tomcat.Exports["install"]>[0] } p
		 * @param { slime.$api.Events<slime.jsh.shell.tools.tomcat.install.Events> } events
		 * @returns
		 */
		var install = function(p,events) {
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
				if (!p.version) {
					//	TODO	this essentially disables the usage of Apache mirrors now that we are on a version that is EOLed.
					//			We can go back to mirroring when we get onto a maintained version.
					p.version = "7.0.109";
				}
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
		};

		$exports.install = $context.$api.Events.Function(
			install,
			{
				console: function(e) {
					jsh.shell.console(e.detail);
				}
			}
		);

		$exports.require = $api.Events.Function(
			/**
			 *
			 * @param { Parameters<slime.jsh.shell.tools.internal.tomcat.Exports["install"]>[0] } p
			 * @param { slime.$api.Events<slime.jsh.shell.tools.tomcat.install.Events> } events
			 */
			function(p,events) {
				jsh.shell.jsh.require({
					satisfied: function() { return Boolean($exports.installed()); },
					install: function() { return install(p,events); }
				});
			}
		);

		$exports.test = {
			getLatestVersion: getLatestVersion
		}
	}
//@ts-ignore
)($api,$context,$exports);
