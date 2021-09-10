//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	function($context,$loader,$export) {
		if (!$context.window) {
			$context.window = (function() { return this; })();
		}
		$export(
			$loader.module("module.js", {
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
