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
		var wfpath = $api.fp.impure.Input.map(
			function() { return $context.base.pathname.os.adapt(); },
			jsh.file.Location.directory.relativePath("wf.path"),
			$api.fp.Maybe.impure.exception({
				try: $api.fp.world.mapping(jsh.file.Location.file.read.string()),
				nothing: function(location) { return new Error("No file found at " + location.pathname); }
			})
		);

		$exports.initialize = $api.fp.impure.Process.compose([
			$api.fp.impure.now.input(
				$api.fp.impure.Input.map(
					wfpath,
					jsh.wf.project.subproject.initialize.process
				)
			),
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
