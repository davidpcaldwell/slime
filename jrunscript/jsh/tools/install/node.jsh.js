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
	 * @param { slime.jsh.script.cli.main } main
	 */
	function($api,jsh,main) {
		main(
			$api.fp.pipe(
				jsh.script.cli.option.pathname({ longname: "to" }),
				jsh.script.cli.option.string({ longname: "version" }),
				function(p) {
					$api.fp.world.now.action(
						jsh.shell.tools.node.object.install,
						{
							location: p.options.to,
							version: p.options.version
						}
					);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh,main);
