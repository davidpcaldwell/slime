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
	 * @param { slime.jsh.wf.internal.module.Context } $context
	 * @param { slime.loader.Export<slime.jsh.wf.internal.module.Exports> } $export
	 */
	function($api,$context,$export) {
		var filesystem = ($context.world.filesystem) ? $context.world.filesystem : $context.library.file.world.spi.filesystems.os;

		/** @type { slime.jsh.wf.internal.module.Exports["Project"]["getTypescriptVersion"] } */
		var Project_getTypescriptVersion = $api.fp.pipe(
			/**
			 * @param { slime.jsh.wf.Project } project
			 * @returns { slime.jrunscript.file.world.Location }
			 */
			function(project) {
				return {
					filesystem: filesystem,
					pathname: project.base
				};
			},
			$context.library.file.world.Location.relative("tsc.version"),
			$api.fp.world.mapping($context.library.file.world.Location.file.read.string()),
			$api.fp.Maybe.else($api.fp.returning("4.7.3"))
		);

		$export({
			Project: {
				getTypescriptVersion: Project_getTypescriptVersion
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
