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
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jsh.wf.internal.module.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var code = {
			/** @type { slime.jsh.wf.internal.typescript.Script } */
			typescript: $loader.script("typescript.js"),
		};

		var library = {
			typescript: code.typescript({
				library: {
					file: $context.library.file,
					shell: $context.library.shell,
					node: $context.library.node
				},
				world: {
					filesystem: ($context.world && $context.world.filesystem) ? $context.world.filesystem : void(0)
				}
			})
		}

		$export({
			typescript: library.typescript.module,
			Project: {
				typescript: library.typescript.Project
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
