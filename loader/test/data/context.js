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
	 * @param { any } $context
	 * @param { slime.loader.Export<{ provided: any }> } $export
	 */
	function($api,$context,$export) {
		$export({ provided: $context });
	}
//@ts-ignore
)($api,$context,$export);
