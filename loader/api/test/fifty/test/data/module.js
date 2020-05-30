//@ts-check
(
	/**
	 * @param { slime.fifty.test.data.shopping.Exports } $exports
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

			/** @type { slime.fifty.test.data.shopping.Database["add"] } */
			this.add = function(p) {
				items.push(p.item);
			}
		};
	}
//@ts-ignore
)($exports)
