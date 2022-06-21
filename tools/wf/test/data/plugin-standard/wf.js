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
	 * @param { slime.jsh.wf.standard.Interface } $exports
	 */
	function(jsh,$context,$exports) {
		jsh.wf.project.git.installHooks();
		jsh.wf.project.initialize(
			$context,
			{
				test: function() {
					return true;
				}
			},
			$exports
		);
	}
//@ts-ignore
)(jsh,$context,$exports);
