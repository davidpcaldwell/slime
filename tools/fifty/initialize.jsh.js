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
		var location = jsh.shell.jsh.src.getRelativePath("local/src/typescript");
		if (!location.directory) {
			var typescript = jsh.tools.git.oo.Repository({ remote: "https://github.com/microsoft/TypeScript.git" });
			typescript.clone({ to: location });
		}
	}
//@ts-ignore
)(jsh)
