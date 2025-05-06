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
	 * @param { slime.runtime.loader.internal.test.store.part.Context } $context
	 * @param { slime.loader.Export<slime.runtime.loader.internal.test.store.part.Exports> } $export
	 */
	function($api,$context,$export) {
		$export({
			doubled: $context.x * 2,
			squared: $context.x * $context.x
		});
	}
//@ts-ignore
)($api,$context,$export);
