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
		var invocation = jsh.shell.Invocation.sudo({
			nocache: true,
			askpass: jsh.shell.jsh.src.getFile("rhino/shell/sudo-askpass.bash")
		})(jsh.shell.Invocation.create({
			command: "ls"
		}));

		$api.fp.world.now.action(
			jsh.shell.world.action,
			invocation
		);

		//	TODO	Why is the explicit exit needed?
		jsh.shell.exit(0);
	}
//@ts-ignore
)($api,jsh);
