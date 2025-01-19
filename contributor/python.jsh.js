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
				var local = base.getRelativePath("local").createDirectory({
					exists: function(dir) {
						return false;
					}
				});
				var to = local.getRelativePath("homebrew");
				if (!to.directory) {
					to.createDirectory();
					jsh.shell.run({
						command: "tar",
						arguments: ["xz", "--strip", "1", "-C", "homebrew"],
						//	TODO	might not exist
						directory: local,
						stdio: {
							input: new jsh.http.Client().request({
								url: "https://github.com/Homebrew/brew/tarball/master"
							}).body.stream
						}
					})
				}

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

		//	TODO	somehow the Homebrew update triggers a git update on the SLIME project directory, via an unknown mechanism. So
		//			we skip this update and disable autoupdate in the Homebrew invocations above.
		//	homebrew.update();
		homebrew.install({
			formula: "python@3.12"
		});
		homebrew.upgrade({
			formula: "python@3.12"
		});
	}
//@ts-ignore
)($api,jsh);
