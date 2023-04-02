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
		var inputs = {
			base: $api.fp.impure.Input.map(
				$api.fp.impure.Input.value(jsh.script.world.file),
				jsh.file.world.Location.parent(),
				jsh.file.world.Location.relative("../../../..")
			)
		};

		jsh.script.cli.main(
			function(invocation) {
				$api.fp.world.now.action(
					jsh.tools.code.handleGitTrailingWhitespace,
					{
						repository: inputs.base().pathname,
						//exclude: jsh.project.code.files.exclude,
						isText: jsh.project.code.files.isText,
						nowrite: true
					},
					{
						unknownFileType: function(e) {
							jsh.shell.console("Unknown file type: " + e.detail.path);
						},
						foundAt: function(e) {
							jsh.shell.console("Trailing whitespace: " + e.detail.file.path + ":" + e.detail.line.number);
						},
						foundIn: function(e) {
						},
						notFoundIn: function(e) {
						}
					}
				);
			}
		)
	}
//@ts-ignore
)($api,jsh,main);
