//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.fp.internal.methods.Context } $context
	 * @param { slime.loader.Export<slime.$api.fp.methods.Exports> } $export
	 */
	function($context,$export) {
		/** @type { slime.$api.fp.methods.Exports["specify"] } */
		var specify = function(t) {
			return function(methods) {
				return /** @type { slime.$api.fp.methods.Specified<typeof t,typeof methods> } */(Object.fromEntries(
					Object.entries(methods).map(function(entry) {
						return [
							entry[0],
							//	TODO	would be nice to defer implementation of this, but might require use of
							//			Object.defineProperty
							function() {
								return entry[1](t);
							}
						]
					})
				))
			}
		};

		/** @type { slime.$api.fp.methods.Exports["flatten"] } */
		var flatten = function(specified) {
			/** @type { slime.external.lib.typescript.Partial<ReturnType<typeof flatten>> } */
			var rv = {};
			Object.entries(specified).forEach(function(entry) {
				rv = $context.library.Object.defineProperty({
					name: entry[0],
					descriptor: {
						enumerable: true,
						get: function() {
							return entry[1]();
						}
					}
				})(rv);
			});
			//@ts-ignore
			return /** @type { ReturnType<typeof flatten> } */(rv);
		};

		/** @type { slime.$api.fp.methods.Exports["pin"] } */
		var pin = function(t) {
			return function(operations) {
				return flatten(specify(t)(operations));
			}
		};

		$export({
			specify: specify,
			flatten: flatten,
			pin: pin
		});
	}
//@ts-ignore
)($context,$export);
