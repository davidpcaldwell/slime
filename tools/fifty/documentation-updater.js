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
	 * @param { slime.tools.documentation.updater.Context } $context
	 * @param { slime.loader.Export<slime.tools.documentation.updater.Exports> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.tools.documentation.updater.Exports["Updater"] } */
		var Updater = function(settings) {
			var Update = function(p) {
				var invocation = $context.typedoc.invocation({
					project: { base: settings.project },
					stdio: {
						output: "string",
						error: "string"
					}
				});
				var result = $api.fp.world.now.question(
					$context.library.shell.world.question,
					invocation
				);
				if (result.status != 0) {
					return {
						status: { code: 500 },
						body: {
							type: "text/plain",
							string: "TypeDoc invocation failed:\nSTDOUT:\n" + result.stdio.output + "\nSTDERR:\n" + result.stdio.error
						}
					}
				}
			}

			return {};
		}
	}
//@ts-ignore
)($api,$context,$export);
