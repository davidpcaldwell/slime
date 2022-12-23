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
			function(p) {
				var before = typeof(jsh.httpd.Tomcat) == "function";
				jsh.shell.tools.tomcat.old.require();
				var after = typeof(jsh.httpd.Tomcat) == "function";
				jsh.shell.echo(
					JSON.stringify({
						before: before,
						after: after
					})
				)
			}
		)
	}
//@ts-ignore
)($api,jsh,main);
