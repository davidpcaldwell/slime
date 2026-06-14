//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var homebrew = (
			function installLocalHomebrew(base) {
				var HOMEBREW_GIT_URL = "https://github.com/Homebrew/brew.git";
				var local = base.getRelativePath("local").createDirectory({
					exists: function(dir) {
						return false;
					}
				});

				var to = local.getRelativePath("homebrew");

				var clone = function() {
					jsh.shell.run({
						command: "git",
						arguments: ["clone", "--depth", "1", HOMEBREW_GIT_URL, "homebrew"],
						directory: local
					});
				};

				var convertTarballToGitCheckout = function() {
					jsh.shell.run({ command: "git", arguments: ["init"], directory: to.directory });
					try {
						jsh.shell.run({ command: "git", arguments: ["remote", "remove", "origin"], directory: to.directory });
					} catch (e) {
						// Ignore missing origin for first-time conversion.
					}
					jsh.shell.run({ command: "git", arguments: ["remote", "add", "origin", HOMEBREW_GIT_URL], directory: to.directory });

					try {
						jsh.shell.run({ command: "git", arguments: ["fetch", "--depth", "1", "origin", "master"], directory: to.directory });
						jsh.shell.run({ command: "git", arguments: ["checkout", "-B", "master", "FETCH_HEAD"], directory: to.directory });
					} catch (e) {
						jsh.shell.run({ command: "git", arguments: ["fetch", "--depth", "1", "origin", "main"], directory: to.directory });
						jsh.shell.run({ command: "git", arguments: ["checkout", "-B", "main", "FETCH_HEAD"], directory: to.directory });
					}
				};

				if (!to.directory) {
					clone();
				} else {
					try {
						jsh.shell.run({ command: "git", arguments: ["rev-parse", "--is-inside-work-tree"], directory: to.directory });
					} catch (e) {
						convertTarballToGitCheckout();
					}
				}

				var run = $api.fp.now(
					jsh.shell.subprocess.question,
					$api.fp.world.Sensor.mapping()
				);

				run({
					command: "git",
					arguments: ["config", "core.hooksPath", ".git/hooks"]
				});

				var homebrew = (function(directory) {
					var program = directory.getFile("bin/brew");

					var brew = function(command,args) {
						jsh.shell.run({
							command: program,
							arguments: (function() {
								var rv = [command];
								if (args) rv.push.apply(rv,args);
								return rv;
							})(),
							environment: $api.Object.compose(
								jsh.shell.environment,
								{
									HOMEBREW_NO_AUTO_UPDATE: "1"
								}
							)
						})
					}

					return {
						directory: to.directory,
						update: function(p) {
							brew("update")
						},
						install: function(p) {
							brew(
								"install",
								(function() {
									var rv = [];
									rv.push(p.formula);
									return rv;
								})()
							)
						},
						upgrade: function(p) {
							brew(
								"upgrade",
								(function() {
									var rv = [];
									rv.push(p.formula);
									return rv;
								})()
							)
						}
					}
				})(to.directory);

				return homebrew;
			}
		)(jsh.script.file.parent.parent);

		homebrew.update();

		// Avoid install+upgrade back-to-back: install when missing, otherwise upgrade.
		if (homebrew.directory.getRelativePath("Cellar/python@3.14").directory) {
			homebrew.upgrade({
				formula: "python@3.14"
			});
		} else {
			homebrew.install({
				formula: "python@3.14"
			});
		}
	}
	//@ts-ignore
)($api, jsh);
