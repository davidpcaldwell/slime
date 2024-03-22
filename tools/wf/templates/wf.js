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
	 * @param { slime.jsh.wf.cli.Context } $context
	 * @param { slime.jsh.wf.standard.Interface & { initialize: any, hello: any } } $exports
	 */
	function($api,jsh,$context,$exports) {
		$exports.initialize = $api.fp.impure.Process.compose([
			jsh.wf.project.subprojects.initialize.process,
			jsh.wf.project.git.installHooks
		]);

		jsh.wf.project.initialize(
			$context,
			{
				test: function(events) {
					return true;
				}
			},
			$exports
		);
	}
//@ts-ignore
)($api,jsh,$context,$exports);
