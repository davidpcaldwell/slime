//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.web.browser.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.web.Exports> } $export
	 */
	function($context,$loader,$export) {
		if (!$context.window) {
			$context.window = (function() { return this; })();
		}
		/** @type { slime.web.Script } */
		var load = $loader.script("module.js");
		$export(
			load({
				window: $context.window,
				escaper: {
					encode: $context.window.escape,
					decode: $context.window.unescape
				}
			})
		)
	}
//@ts-ignore
)($context,$loader,$export);
