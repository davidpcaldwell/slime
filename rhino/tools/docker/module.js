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
	 * @param { slime.loader.Export<slime.jrunscript.tools.docker.Export> } $export
	 */
	function($api,$export) {
		var cli = {
			exec: function(p) {
				return {
					command: ["exec"],
					arguments: $api.Array.build(function(rv) {
						if (p.interactive) rv.push("--interactive");
						if (p.tty) rv.push("--tty");
						rv.push(p.container);
						rv.push(p.command);
						if (p.arguments) rv.push.apply(rv, p.arguments);
					})
				};
			},
			shell: function(p) {
				return {
					command: "docker",
					arguments: p.command.concat(p.arguments)
				};
			}
		};

		$export({
			engine: {
				cli: cli
			},
			install: function(p) {
				return $api.Function.impure.tell(function(events) {
					if (!p.destination.directory) {
						var dmg = p.library.install.get({
							url: "https://desktop.docker.com/mac/stable/amd64/Docker.dmg"
						});
						p.library.shell.run({
							command: "hdiutil",
							arguments: ["attach", dmg]
						});
						var invocation = {
							command: "cp",
							arguments: ["-R", "/Volumes/Docker/Docker.app", p.destination]
						};
						if (p.sudo) {
							invocation = p.library.shell.invocation.sudo({
								askpass: p.sudo.askpass
							})(p.library.shell.Invocation.old(invocation))
						}
						p.library.shell.run(invocation);
						events.fire("installed", p.destination.directory);
					} else {
						events.fire("found", p.destination.directory);
					}
				})
			}
		});
	}
//@ts-ignore
)($api,$export);
