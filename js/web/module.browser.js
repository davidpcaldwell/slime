//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	function($loader,$export) {
		$export(
			$loader.module("module.js", {
				window: window,
				escaper: {
					encode: window.escape,
					decode: window.unescape
				}
			})
		)
	}
//@ts-ignore
)($loader,$export);
