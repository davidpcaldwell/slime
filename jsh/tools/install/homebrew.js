//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.loader.Export<slime.jsh.tools.install.module.homebrew.Exports> } $export
	 */
	function(jsh,$export) {
		/**
		 *
		 * @param { Parameters<slime.jsh.tools.install.module.homebrew.Exports["get"]>[0] } p
		 * @returns { slime.jsh.tools.install.module.Homebrew }
		 */
		function getLocalHomebrew(p) {
			var to = p.location.createDirectory({
				exists: function(dir) {
					return false;
				}
			});

			jsh.shell.run({
				command: "tar",
				arguments: ["xz", "--strip", "1", "-C", to.pathname.basename],
				//	TODO	might not exist
				directory: to.parent,
				stdio: {
					input: new jsh.http.Client().request({
						url: "https://github.com/Homebrew/brew/tarball/master"
					}).body.stream
				}
			})

			var homebrew = (function(directory) {
				var program = directory.getFile("bin/brew");

				var brew = function(command,args) {
					jsh.shell.run({
						command: program,
						arguments: (function() {
							var rv = [command];
							if (args) rv.push.apply(rv,args);
							return rv;
						})()
					})
				}

				return {
					directory: to,
					update: function() {
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
			})(to);

			return homebrew;
		}

		$export({
			get: function(p) {
				return getLocalHomebrew(p);
			}
		});
	}
//@ts-ignore
)(jsh,$export);
