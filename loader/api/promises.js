//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.loader.Export<slime.definition.test.promises.Export> } $export
	 */
	function($export) {
		var registry = (function() {
			var list = [];

			//	Unused but could be used to remove promises when they are ressolved / caught, should that become necessary
			var remove = function(instance) {
				var index = list.indexOf(instance);
				if (index == -1) throw new Error("Already removed.");
				registry.splice(index,1);
			}

			var allSettled = function(promises) {
				/**
				 *
				 * @param { Promise<any> } promise
				 * @returns { Promise<any> }
				 */
				var settle = function(promise) {
					return promise.then(function(value) {
						return value;
					}).catch(function(e) {
						return e;
					});
				}

				return Promise.all(
					promises.map(settle)
				);
			}

			return {
				add: function(item) {
					list.push(item);
				},
				list: function() {
					return list;
				},
				wait: function() {
					return allSettled(list);
				},
				clear: function() {
					list.splice(0,list.length);
				}
			}
		})();

		window.Promise = (function(was) {
			/**
			 * @constructor
			 */
			function RegisteredPromise(executor) {
				console.log("Created promise", executor);
				this.then = void(0);
				this.catch = void(0);
				var rv = new was(executor);
				registry.add(rv);
				return rv;
			}
			//	Copy all properties
			for (var x in was) {
				RegisteredPromise[x] = was[x];
			}
			//	Make typescript happy if above didn't work

			//	At least in Chrome, this calls Promise constructor
			RegisteredPromise.resolve = was.resolve;

			RegisteredPromise.race = was.race;
			RegisteredPromise.all = was.all;
			RegisteredPromise.reject = was.reject;
			return RegisteredPromise;
		})(window.Promise);

		$export({
			Promise: window.Promise,
			registry: registry
		})
	}
//@ts-ignore
)($export);
