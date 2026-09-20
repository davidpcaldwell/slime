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
	 * @param { slime.loader.old.Loader } $loader
	 * @param { slime.loader.Export<slime.jsh.shell.tools.internal.tomcat.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var getDefaultMajorVersionForJava = function(javaMajorVersion) {
			if (javaMajorVersion >= 17) return 11;
			if (javaMajorVersion >= 11) return 10;
			if (javaMajorVersion >= 8) return 9;
			throw new Error("Unsupported Java version " + javaMajorVersion);
		};

		var getDefaultMajorVersion = function() {
			return getDefaultMajorVersionForJava($context.jsh.internal.bootstrap.java.install.version.major());
		};

		var getMajorVersion = function(version) {
			return $api.fp.now(String(version).split(".")[0], Number);
		};

		var getRequiredJavaMajorVersion = function(tomcatMajorVersion) {
			if (tomcatMajorVersion == 11) return 17;
			if (tomcatMajorVersion == 10) return 11;
			if (tomcatMajorVersion == 9) return 8;
			throw new Error("Unsupported Tomcat version: " + tomcatMajorVersion);
		};

		/**
		 * @param { { tomcat: string|number, java: number } } p
		 */
		var isCompatible = function(p) {
			return p.java >= getRequiredJavaMajorVersion(getMajorVersion(p.tomcat));
		};

		var checkCompatible = function(version) {
			var java = $context.jsh.internal.bootstrap.java.install.version.major();
			if (!isCompatible({ tomcat: version, java: java })) {
				throw new Error("Tomcat " + version + " requires Java " + getRequiredJavaMajorVersion(getMajorVersion(version)) + " or later; running Java " + java + ".");
			}
		};

		var DEFAULT_VERSION = {
			//	As of 2026 September 20
			9: "9.0.122", // JDK 8+
			10: "10.1.60", // JDK 11+
			11: "11.0.26" // JDK 17+
		};

		/** @type { slime.jsh.shell.tools.tomcat.old.World } */
		var world = {
			findApache: $context.library.install.apache.find,
			getLatestVersion: function(major) {
				return function(events) {
					try {
						var suffix = (major < 10) ? "0" : "";
						//	This step would fail for Tomcat 7
						var downloadRawHtml = new $context.library.http.Client().request({
							url: "http://tomcat.apache.org/download-" + major + suffix + ".cgi",
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
						return $api.fp.Maybe.from.nothing();
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
		 * @returns { slime.jsh.shell.tools.tomcat.old.World }
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
		 * @return { slime.$api.fp.world.Sensor<number,{ online: { major: number, latest: slime.$api.fp.Maybe<string> } },string> }
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

		var getLayout = function(installation, version) {
			var major = getMajorVersion(version);
			var root = installation.library || installation.base;
			return {
				base: root + "/" + String(major),
				library: root
			};
		};

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["test"]["getVersionFromReleaseNotes"] } */
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
					$context.library.file.world.Location.from.os,
					$context.library.file.world.Location.relative("RELEASE-NOTES"),
					$api.fp.world.mapping($context.library.file.world.Location.file.read.string.world())
				);
			}
		};

		/**
		 *
		 * @param { { local: slime.jrunscript.file.File, version: string, p_to: slime.jrunscript.file.Pathname } } p
		 */
		var basicInstall = function(p) {
			/**
			 * @param { slime.$api.event.Producer<{ unzipping: { local: string, to: string }, installing: { to: string } }> } events
			 */
			return function(events) {
				var local = p.local;
				var p_to = p.p_to;
				var version = p.version;
				var to = $context.library.shell.TMPDIR.createTemporary({ directory: true });
				events.fire("unzipping", { local: local.pathname.toString(), to: to.pathname.toString() });
				$context.library.file.unzip({
					zip: local,
					to: to
				});
				events.fire("installing",{ to: p_to.toString() });
				var parent = p_to.parent;
				if (parent && !parent.directory) parent.createDirectory({ recursive: true });
				//	TODO	unclear what case this mv addresses; maybe something exotic like moving across filesystems?
				if ($context.library.shell.PATH.getCommand("mv")) {
					if (p_to.directory) {
						p_to.directory.remove();
					}
					var sub = to.getSubdirectory("apache-tomcat-" + version);
					if (!sub) {
						throw new Error("No subdirectory " + "apache-tomcat-" + version + " in " + to.pathname.toString());
					}
					$context.library.shell.run({
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
					var findApache = (p.world && p.world.findApache) ? p.world.findApache : $context.library.install.apache.find;
					var world = (p.world) ? p.world : void(0);
					var majorVersion = (p.version) ? getMajorVersion(p.version) : getDefaultMajorVersion();
					var version = p.version || getLatestVersion(world)(majorVersion);
					checkCompatible(version);
					var target = getLayout(installation, version);
					var mirror = (p.version) ? "https://archive.apache.org/dist/" : void(0);
					//	TODO	this does not seem to fail on 404
					//	TODO	logging console messages for findApache is not ideal, should fire event instead
					var local = $api.fp.world.now.question(
						findApache,
						{
							path: "tomcat/tomcat-" + majorVersion + "/v" + version + "/bin/apache-tomcat-" + version + ".zip",
							mirror: mirror
						},
						{
							console: function(e) {
								$context.console(e.detail);
							}
						}
					);
					basicInstall({
						local: local,
						version: version,
						p_to: $context.library.file.Pathname(target.base)
					})(events);
					//debugger;
					var installed = Installation_getVersion(target);
					events.fire("installed", {
						version: (installed.present) ? installed.value : void(0)
					})
				};
			};
		};

		var Installation_from_jsh = function() {
			if (!$context.jsh.shell.jsh.lib) return null;
			var library = $context.jsh.shell.jsh.lib.getRelativePath("tomcat").os.adapt().pathname;
			return {
				base: getLayout({ base: library }, String(getDefaultMajorVersion()) + ".0.0").base,
				library: library
			}
		}

		/** @type { slime.jsh.shell.tools.internal.tomcat.require } */
		var newRequireGeneralize = function(installation) {
			return function(p) {
				return function(events) {
					var replace = p.replace || (function() {
						return p.version ? function(version) {
							return version != p.version;
						} : function(version) {
							return false;
						}
					})();
					var MAJOR_VERSION = p.world.getDefaultMajorVersion();
					var version = p.version || getLatestVersion(p.world)(MAJOR_VERSION);
					checkCompatible(version);
					var target = getLayout(installation, version);
					var installed = Installation_getVersion(target);
					/** @type { boolean } Whether to install the provided version. */
					var proceed;
					if (installed.present) {
						events.fire("found", { version: installed.value } );
						var update = replace(installed.value);
						if (update) {
							//	delete existing
							$api.fp.world.now.action(
								$context.library.file.Location.directory.remove.wo,
								$context.library.file.Location.from.os(target.base)
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
						if (target.base == Installation_from_jsh().base) {
							//	TODO	refactor so instead of reloading plugin, plugin exposes a method allowing it to be reloaded
							//	TODO	probably don't need to do this if it was already installed
							$context.jsh.loader.plugins($loader.Child("../../../../rhino/http/servlet/"));
						}
					}
				}
			}
		};

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["Installation"]["require"] } */
		var newRequire = function(installation) {
			return function(p) {
				if (!p) p = {};
				return newRequireGeneralize(installation)({
					world: (
						function() {
							var was = getWorld(p.world);
							return {
								getDefaultMajorVersion: getDefaultMajorVersion,
								getLatestVersion: was.getLatestVersion,
								findApache: was.findApache
							}
						}
					)(),
					replace: p.replace,
					version: p.version
				});
			}
		}

		/** @type { slime.jsh.shell.tools.internal.tomcat.Exports["Installation"] } */
		var Installation = {
			from: {
				jsh: Installation_from_jsh
			},
			getVersion: Installation_getVersion,
			install: newInstall,
			require: newRequire
		};

		$export({
			Installation: Installation,
			jsh: (Installation_from_jsh()) ? (
				function() {
					var means = Installation.require(Installation.from.jsh())
					return {
						require: {
							world: means,
							simple: $api.fp.world.Means.process({
								means: means,
								order: {}
							})
						}
					}
				}
			)() : null,
			old: {
				require: function(argument, handler) {
					var listener = $api.events.Handlers.attached(handler);
					$api.fp.world.now.action(
						newRequire(Installation.from.jsh()),
						argument,
						{
							found: function(e) {
								listener.fire("console", "Found Tomcat " + e.detail.version + ".");
							},
							unzipping: function(e) {
								listener.fire("console", "Unzipping Tomcat from " + e.detail.local + " to " + e.detail.to + " ...");
							},
							installing: function(e) {
								listener.fire("console", "Installing Tomcat to " + e.detail.to + " ...");
							},
							installed: function(e) {
								listener.fire("console", "Installed Tomcat " + e.detail.version);
							}
						}
					);
					$api.events.Handlers.detach(listener);
				}
			},
			world: {
				getDefaultMajorVersion: getDefaultMajorVersion,
				getLatestVersion: world.getLatestVersion,
				findApache: world.findApache
			},
			api: function(world) {
				return {
					world: world
				};
			},
			test: {
				getVersionFromReleaseNotes: getVersion,
				getReleaseNotes: getReleaseNotes,
				getLatestVersion: getLatestVersionUsingWorld(void(0)),
				getDefaultMajorVersionForJava: getDefaultMajorVersionForJava,
				getRequiredJavaMajorVersion: getRequiredJavaMajorVersion,
				isCompatible: isCompatible,
				getLayout: getLayout
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
