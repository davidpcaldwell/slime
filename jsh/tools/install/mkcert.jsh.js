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
		//	TODO	deal with Firefox
		//	TODO	deal with Java
		var invocation = jsh.script.cli.invocation(
			$api.Function.pipe(
				jsh.script.cli.option.pathname({ longname: "destination", default: jsh.shell.jsh.lib.getRelativePath("bin/mkcert") })
			)
		);

		jsh.shell.tools.mkcert.install({ destination: invocation.options.destination });
	}
//@ts-ignore
)($api,jsh);
