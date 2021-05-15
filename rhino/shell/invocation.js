//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.loader.Export<slime.jrunscript.shell.Exports["invocation"]> } $export
	 */
	function($api,$export) {
		$export(
			{
				sudo: function(settings) {
					//	TODO	sudo has preserve-env and preserver-env= flags. Should make the relationship
					//			more explicit
					//			between that and the environment provided normally, e.g., how could we pass an explicit environment
					//			to sudo? Maybe by transforming the command into an `env` command?
					return function(invocation) {
						return $api.Object.compose(invocation, {
							command: "sudo",
							arguments: $api.Array.build(function(array) {
								if (settings && settings.askpass) array.push("--askpass");
								if (settings && settings.nocache) array.push("--reset-timestamp")
								array.push(invocation.command);
								array.push.apply(array, invocation.arguments);
							}),
							environment: $api.Object.compose(
								invocation.environment,
								(settings && settings.askpass) ? { SUDO_ASKPASS: settings.askpass } : {}
							),
							directory: invocation.directory,
							stdio: invocation.stdio
						});
					}
				}
			}
		)
	}
//@ts-ignore
)($api,$export);
