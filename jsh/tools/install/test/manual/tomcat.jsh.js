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
		var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
		jsh.shell.console("Installing to " + tmp);
		tmp.directory.remove();
		jsh.shell.tools.tomcat.install({
			version: "7.0.109",
			to: tmp
		})
	}
//@ts-ignore
)($api,jsh);
