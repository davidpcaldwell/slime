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
		//	TODO	is this script still useful? Problem is, adding Rhino to an existing built shell would mean recompiling the jsh.jar
		//			launcher. So for a built shell, we need to add it beforehand. Perhaps this script should fail for a built shell and
		//			be used for unbuilt shells? Or perhaps for built shells, it should overwrite jsh.jar?
		var parameters = jsh.script.getopts({
			options: {
				local: jsh.file.Pathname,
				replace: false,
				version: String
			}
		});

		jsh.shell.tools.rhino.install.old({
			local: (parameters.options.local) ? parameters.options.local.file : null,
			replace: parameters.options.replace,
			version: parameters.options.version
		});
	}
//@ts-ignore
)(jsh);
