//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.wf.cli.Context } $context
	 * @param { slime.jsh.wf.standard.Interface & { initialize: any } } $exports
	 */
	function(jsh,$context,$exports) {
		$exports.initialize = function() {
			jsh.wf.project.git.installHooks();
		}

		jsh.wf.project.initialize(
			$context,
			{
				lint: jsh.wf.checks.lint({
					isText: function(entry) {
						if (entry.path == ".gitmodules") return true;
						if (entry.path == "wf") return true;
						if (/^slime\//.test(entry.path)) {
							return jsh.project.code.files.isText({
								path: entry.path.substring("slime/".length),
								file: entry.file
							});
						}
						return jsh.project.code.files.isText(entry);
					}
				}),
				test: function() {
					return true;
				}
			},
			$exports
		);
	}
//@ts-ignore
)(jsh,$context,$exports);
