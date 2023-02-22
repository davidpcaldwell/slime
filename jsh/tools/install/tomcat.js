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
	 * @param { slime.old.Loader } $loader
	 * @param { slime.loader.Export<slime.jsh.shell.tools.internal.tomcat.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var jsh = $context.jsh;
		if (!jsh) throw new TypeError("No jsh.");

		var MAJOR_VERSION = 9;

		//	As of 2022 Dec 15
		var DEFAULT_VERSION = {
			//	Tomcat 7 is EOL
			7: "7.0.109",
			8: "8.5.84",
			9: "9.0.70"
		};

		/** @type { slime.jsh.shell.tools.tomcat.World } */
		var world = {
			findApache: jsh.tools.install.apache.find,
			getLatestVersion: function(major) {
				return function(events) {
					try {
						//	This step would fail for Tomcat 7
						var downloadRawHtml = new jsh.http.Client().request({
							url: "http://tomcat.apache.org/download-" + major + "0.cgi",
							evaluate: function(result) {
								return result.body.stream.character().asString()
							}
						});
						var matcher = new RegExp("\<h3 id=\"(" + major + "\..*)\"\>");
						var match = matcher.exec(downloadRawHtml);
						var version = match[1];
						if (version.indexOf("\"") != -1) {
							version = version.substring(0, version.indexOf("\""));
						}
						//	TODO	convert this to world oriented and fire the below as an event
						//	jsh.shell.console("Latest supported Tomcat version from tomcat.apache.org is " + version);
						return $api.fp.Maybe.from.some(version);
					} catch (e) {
						return $api.fp.Maybe.from.nothing;
					}
				};
				//	Code to process the downloads directory to get insight into versions:
				//
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
				// getLatestVersion.pattern = /^apache-tomcat-(\d+)\.(\d+)\.(\d+)\.zip$/;
			}
		};

		/**
		 *
		 * @param { slime.jsh.shell.tools.tomcat.Mock } mock
		 * @returns { slime.jsh.shell.tools.tomcat.World }
		 */
		var getWorld = function(mock) {
			return {
				findApache: (mock && mock.findApache) ? mock.findApache : world.findApache,
				getLatestVersion: (mock && mock.getLatestVersion) ? mock.getLatestVersion : world.getLatestVersion
			}
		};

		/**
		 *
		 * @param { slime.jsh.shell.tools.tomcat.Mock } mock
		 * @return { slime.$api.fp.world.Question<number,{ online: { major: number, latest: slime.$api.fp.Maybe<string> } },string> }
		 */
		var getLatestVersionUsingWorld = function(mock) {
			var world = getWorld(mock);
			var getLatest = $api.fp.world.mapping(world.getLatestVersion);
			return function(major) {
				return function(events) {
					var latest = getLatest(major);
					events.fire("online", { major: major, latest: latest });
					if (latest.present) {
						return latest.value;
					}
					return DEFAULT_VERSION[major];
				}
			}
		};

		var getLatestVersion = function(mock) {
			return $api.fp.world.mapping(getLatestVersionUsingWorld(mock));
		}

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["test"]["getVersion"] } */
		var getVersion = function(releaseNotes) {
			var lines = releaseNotes.split("\n");
			var rv = null;
			lines.forEach(function(line) {
				if (rv) return;
				var matcher = /(?:\s*)Apache Tomcat Version (\d+\.\d+\.\d+)(?:\s*)/;
				var match = matcher.exec(line);
				if (match) {
					rv = match[1];
				}
			});
			return rv;
		};

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["test"]["getReleaseNotes"] } */
		var getReleaseNotes = function(p) {
			return function(events) {
				return $api.fp.now.invoke(
					p.base,
					$context.jsh.file.world.Location.from.os,
					$context.jsh.file.world.Location.relative("RELEASE-NOTES"),
					$api.fp.world.mapping($context.jsh.file.world.Location.file.read.string())
				);
			}
		};

		/**
		 *
		 * @param { { local: slime.jrunscript.file.File, version: string, p_to: slime.jrunscript.file.Pathname } } p
		 */
		var basicInstall = function(p) {
			/**
			 * @param { slime.$api.Events<{ unzipping: { local: string, to: string }, installing: { to: string } }> } events
			 */
			return function(events) {
				var local = p.local;
				var p_to = p.p_to;
				var version = p.version;
				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				events.fire("unzipping", { local: local.pathname.toString(), to: to.pathname.toString() });
				jsh.file.unzip({
					zip: local,
					to: to
				});
				events.fire("installing",{ to: p_to.toString() });
				//	TODO	unclear what case this mv addresses; maybe something exotic like moving across filesystems?
				if (jsh.shell.PATH.getCommand("mv")) {
					if (p_to.directory) {
						p_to.directory.remove();
					}
					var sub = to.getSubdirectory("apache-tomcat-" + version);
					if (!sub) {
						throw new Error("No subdirectory " + "apache-tomcat-" + version + " in " + to.pathname.toString());
					}
					jsh.shell.run({
						command: "mv",
						arguments: [sub.toString(), p_to.toString()]
					});
				} else {
					to.getSubdirectory("apache-tomcat-" + version).move(p_to, { overwrite: true });
				}
			}
		}

		var Installation_getVersion = $api.fp.pipe(
			$api.fp.world.mapping(getReleaseNotes),
			$api.fp.Maybe.map(getVersion)
		);

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["Installation"]["install"] } */
		var newInstall = function(installation) {
			return function(p) {
				return function(events) {
					var findApache = (p.world && p.world.findApache) ? p.world.findApache : jsh.tools.install.apache.find;
					var version = p.version || getLatestVersion(p.world)(MAJOR_VERSION);
					var majorVersion = Number(version.split(".")[0]);
					var mirror = (p.version) ? "https://archive.apache.org/dist/" : void(0);
					//	TODO	this does not seem to fail on 404
					var local = $api.fp.world.now.question(
						findApache,
						{
							path: "tomcat/tomcat-" + majorVersion + "/v" + version + "/bin/apache-tomcat-" + version + ".zip",
							mirror: mirror
						},
						{
							console: function(e) {
								jsh.shell.console(e.detail);
							}
						}
					);
					basicInstall({
						local: local,
						version: version,
						p_to: $context.jsh.file.Pathname(installation.base)
					})(events);
					//debugger;
					var installed = Installation_getVersion(installation);
					events.fire("installed", {
						version: (installed.present) ? installed.value : void(0)
					})
				};
			};
		};

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["Installation"]["require"] } */
		var newRequire = function(installation) {
			return function(p) {
				if (!p) p = {};
				return function(events) {
					var replace = p.replace || (function() {
						return p.version ? function(version) {
							return version != p.version;
						} : function(version) {
							return false;
						}
					})();
					var version = p.version || getLatestVersion(p.world)(MAJOR_VERSION);
					var installed = Installation_getVersion(installation);
					/** @type { boolean } Whether to install the provided version. */
					var proceed;
					if (installed.present) {
						events.fire("found", { version: installed.value } );
						var update = replace(installed.value);
						if (update) {
							//	delete existing
							$api.fp.world.now.action(
								$context.jsh.file.world.Location.directory.remove(),
								$context.jsh.file.world.Location.from.os(installation.base)
							);
							proceed = true;
						} else {
							proceed = false;
						}
					} else {
						proceed = true;
					}
					if (proceed) {
						newInstall(installation)({ world: p.world, version: version })(events);
						if (installation.base == Installation.from.jsh().base) {
							//	TODO	refactor so instead of reloading plugin, plugin exposes a method allowing it to be reloaded
							//	TODO	probably don't need to do this if it was already installed
							jsh.loader.plugins($loader.Child("../../../rhino/http/servlet/"));
						}
					}
				}
			}
		}

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["Installation"] } */
		var Installation = {
			from: {
				jsh: function() {
					return {
						base: jsh.shell.jsh.lib.getRelativePath("tomcat").os.adapt().pathname
					}
				}
			},
			getVersion: Installation_getVersion,
			install: newInstall,
			require: newRequire
		};

		$export({
			input: {
				getDefaultMajorVersion: function() {
					return MAJOR_VERSION;
				}
			},
			Installation: Installation,
			old: {
				require: function(argument, handler) {
					var listener = $api.events.toListener(handler);
					listener.attach();
					$api.fp.world.now.action(
						newRequire(Installation.from.jsh()),
						argument,
						{
							found: function(e) {
								listener.emitter.fire("console", "Found Tomcat " + e.detail.version + ".");
							},
							unzipping: function(e) {
								listener.emitter.fire("console", "Unzipping Tomcat from " + e.detail.local + " to " + e.detail.to + " ...");
							},
							installing: function(e) {
								listener.emitter.fire("console", "Installing Tomcat to " + e.detail.to + " ...");
							},
							installed: function(e) {
								listener.emitter.fire("console", "Installed Tomcat " + e.detail.version);
							}
						}
					);
					listener.detach();
				}
			},
			test: {
				getVersion: getVersion,
				getReleaseNotes: getReleaseNotes,
				getLatestVersion: getLatestVersionUsingWorld(void(0))
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
