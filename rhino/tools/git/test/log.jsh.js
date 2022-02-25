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
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		$api.Function.pipe(
			jsh.wf.cli.$f.option.string({ longname: "revisionRange" }),
			function(p) {
				var repository = jsh.tools.git.Repository({ directory: jsh.shell.PWD });
				jsh.shell.console("revision range = " + p.options.revisionRange);
				var log = repository.log({
					revisionRange: p.options.revisionRange
				});
				jsh.shell.console(JSON.stringify(log));
			}
		)({
			options: {},
			arguments: jsh.script.arguments
		})
	}
//@ts-ignore
)($api,jsh);
