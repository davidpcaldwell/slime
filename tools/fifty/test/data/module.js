//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.fifty.internal.test.data.shopping.Exports } $exports
	 */
	function($exports) {
		/** @constructor */
		$exports.Database = function() {
			var items = [];

			/** @property { slime.fifty.shopping.Item[] } */
			this.items = void(0);
			Object.defineProperty(this, "items", {
				get: function() {
					return Array.prototype.slice.call(items);
				}
			});

			/** @type { slime.fifty.internal.test.data.shopping.Database["add"] } */
			this.add = function(p) {
				items.push(p.item);
			}
		};
	}
//@ts-ignore
)($exports)
