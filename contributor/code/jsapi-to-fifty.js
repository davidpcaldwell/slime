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
	 * @param { slime.project.jsapi.Context } $context
	 * @param { slime.loader.Export<slime.project.jsapi.Exports> } $export
	 */
	function($api,$context,$export) {
		$export({
			comment: function(format) {
				return function(input) {
					input = input.replace(/\<code\>/g, "`").replace(/\<\/code\>/g, "`");
					input = input.replace(/\<i\>/g, "*").replace(/\<\/i\>/g, "*");
					return input;
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
