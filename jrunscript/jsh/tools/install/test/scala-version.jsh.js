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
		var version = $api.fp.world.now.question(
			jsh.shell.tools.scala.Installation.getVersion,
			jsh.shell.tools.scala.Installation.from.jsh()
		);
		jsh.shell.echo(JSON.stringify(version));
	}
//@ts-ignore
)($api,jsh,main);
