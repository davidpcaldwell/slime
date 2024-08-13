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
	 * @param { slime.browser.internal.$api.Context } $context
	 * @param { slime.loader.Export<slime.browser.internal.$api.Exports> } $export
	 */
	function($api,$context,$export) {
		$export({
			timer: {
				schedule: function(p) {
					var now = new $context.time.Date();
					var when = p.next(now);
					var id = $context.time.setTimeout(p.process, when.getTime() - now.getTime());
					return {
						cancel: function() {
							$context.time.clearTimeout(id);
						}
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
