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
		$api.fp.world.Action.now({
			action: jsh.shell.tools.rhino.require.action,
			handlers: {
				console: $api.fp.pipe($api.fp.property("detail"), jsh.shell.console)
			}
		});

		jsh.script.cli.main(function() {
			debugger;
		});
	}
//@ts-ignore
)($api,jsh);
