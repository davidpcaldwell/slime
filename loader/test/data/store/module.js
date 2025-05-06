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
	 * @param { slime.runtime.loader.internal.test.store.Context } $context
	 * @param { slime.runtime.loader.Store } $loader
	 * @param { slime.loader.Export<slime.runtime.loader.internal.test.store.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var code = {
			/** @type { slime.runtime.loader.internal.test.store.part.Script } */
			part: $loader.script("part.js")
		};

		var part = code.part({
			x: $context.n
		});

		$export({
			calculated: part
		});
	}
//@ts-ignore
)($api,$context,$loader,$export);
