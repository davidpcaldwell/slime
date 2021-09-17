//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { { window: Window } } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.web.Exports> } $export
	 */
	function($context,$loader,$export) {
		if (!$context.window) {
			$context.window = (function() { return this; })();
		}
		/** @type { slime.web.load } */
		var load = $loader.factory("module.js");
		$export(
			load({
				window: $context.window,
				escaper: {
					encode: window.escape,
					decode: window.unescape
				}
			})
		)
	}
//@ts-ignore
)($context,$loader,$export);
