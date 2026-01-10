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
		var PATH = jsh.shell.PATH.pathnames;
		PATH.unshift(jsh.shell.java.home.getRelativePath("bin"));
		var result = jsh.shell.kotlin({
			script: jsh.script.file.parent.getFile("hello.kts"),
			environment: $api.Object.compose(jsh.shell.environment, {
				PATH: jsh.file.Searchpath(PATH).toString()
			}),
			stdio: {
				error: String
			}
		});
		jsh.shell.echo(JSON.stringify({
			status: result.status,
			stdio: {
				error: result.stdio.error
			}
		}));
	}
//@ts-ignore
)($api,jsh);
