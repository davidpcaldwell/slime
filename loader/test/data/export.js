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
	 * @param { { export: any } } $context
	 * @param { slime.loader.Export<any> } $export
	 */
	function($api,$context,$export) {
		$export($context.export);
	}
//@ts-ignore
)($api,$context,$export);
