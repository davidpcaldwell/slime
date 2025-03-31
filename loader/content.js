//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.loader.Export<slime.runtime.internal.content.Exports> } $export
	 */
	function($export) {
		/** @typedef { slime.runtime.content.Store } Store */
		/** @typedef { slime.runtime.content.Index } Index */

		/** @type { (store: Store) => store is Index } */
		var isIndex = function(store) {
			return Boolean(store["list"]);
		}

		/** @type { slime.runtime.content.Exports["Store"]["map"] } */
		var map = function(p) {
			return function(store) {
				/** @type { Store } */
				var rv = {
					get: function(path) {
						var match = true;
						for (var i=0; i<p.path.length; i++) {
							if (path[i] != p.path[i]) {
								match = false;
							}
						}
						if (match) {
							return p.store.get(path.slice(p.path.length));
						} else {
							return store.get(path);
						}
					}
				}
				return rv;
			}
		};

		$export({
			Store: {
				map: map
			},
			Entry: {
				is: {
					/** @type { slime.runtime.content.Exports["Entry"]["is"]["IndexEntry"] } */
					IndexEntry: function(e) {
						return Boolean(e["index"]);
					}
				}
			}
		});
	}
//@ts-ignore
)($export);
