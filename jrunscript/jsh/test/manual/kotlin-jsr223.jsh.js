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
	 */
	function(jsh) {
		var parameters = jsh.script.getopts({
			options: {
				message: "(unspecified)"
			}
		});

		var result = jsh.loader.kotlin.run(jsh.script.file.parent.getFile("kotlin.kts"), {
			bindings: {
				message: parameters.options.message
			}
		});

		jsh.shell.console("");
		jsh.shell.console("result from Kotlin = " + result);
	}
//@ts-ignore
)(jsh);
