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
	 * @param { slime.loader.Export<slime.definition.test.promises.Export> } $export
	 */
	function($api,$export) {
		/** @type { slime.definition.test.promises.internal.Events } */
		var events = $api.Events();

		var controlledPromiseId = 0;
		/**
		 *
		 * @returns { ReturnType<slime.definition.test.promises.Export["controlled"]> }
		 */
		var ControlledPromise = function() {
			var resolver;
			var rejector;
			var executor = function(resolve,reject) {
				resolver = resolve;
				rejector = reject;
			}
			executor.toString = function() {
				return "<ControlledPromise " + ++controlledPromiseId + ">";
			}
			var promise = new Promise(executor);
			return {
				promise: promise,
				resolve: resolver,
				reject: rejector
			}
		};

		var Registry = function() {
			var name;
			var list = [];

			var created = function(e) {
				console.log("adding promise to registry", e.detail, name);
				list.push(e.detail);
			};

			events.listeners.add("created", created);

			//	Unused but could be used to remove promises when they are ressolved / caught, should that become necessary
			var remove = function(instance) {
				var index = list.indexOf(instance);
				if (index == -1) {
					console.log("Not pertinent to", name, instance);
				} else {
					list.splice(index,1);
				}
			};

			var settled = function(e) {
				remove(e.detail);
				if (list.length == 0) {
					controlled.resolve(void(0));
				} else {
					console.log("pending", name, list);
				}
			}

			events.listeners.add("settled", settled);

			var controlled = ControlledPromise();
			remove(controlled.promise);

			// var allSettled = function(promises) {
			// 	// /**
			// 	//  *
			// 	//  * @param { Promise<any> } promise
			// 	//  * @returns { Promise<any> }
			// 	//  */
			// 	// var settle = function(promise) {
			// 	// 	//	Not using .finally() to preserve IE compatibility, perhaps unwisely
			// 	// 	return promise.then(function(value) {
			// 	// 		console.log("settled - fulfilled", promise, value);
			// 	// 		remove(promise);
			// 	// 		return value;
			// 	// 	}).catch(function(e) {
			// 	// 		console.log("settled - rejected", promise, e)
			// 	// 		remove(promise);
			// 	// 		return e;
			// 	// 	});
			// 	// };

			// 	// return Promise.all(
			// 	// 	promises.map(settle)
			// 	// );

			// };

			return {
				wait: function() {
					console.log("waiting for list length", list.length, name, list);
					if (list.length == 0) {
						console.log("resolving wait promise for", name);
						controlled.resolve(void(0));
					}
					return controlled.promise.then(function() {
						console.log("wait promise resolved for", name);
						events.listeners.remove("created", created);
						events.listeners.remove("settled", created);
					});
				},
				test: {
					list: function() {
						return list;
					},
					clear: function() {
						list.splice(0,list.length);
					},
					setName: function(value) {
						name = value;
					}
				}
			}
		};

		window.Promise = (function(was) {
			/**
			 * @constructor
			 */
			function RegisteredPromise(executor) {
				console.log("Created promise", executor);
				this.then = void(0);
				this.catch = void(0);
				var rv = new was(executor);
				rv["executor"] = executor.toString();
				events.fire("created", rv);
				rv.then(function(value) {
					console.log("settled - fulfilled", rv, value);
					events.fire("settled", rv);
					return value;
				})
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
			controlled: ControlledPromise,
			Registry: Registry,
			console: console
		})
	}
//@ts-ignore
)($api,$export);
