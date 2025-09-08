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
		//	TODO	this log message is because loading this more than once may cause it not to work; should come up with optimal
		//			strategy for dealing with this (either making it work or a strategy to prevent multiple loads or make a second
		//			load a no-op)
		window.console.log("loading tools/fifty/promises.js ..." + new Error("Stack trace").stack);

		/** @type { slime.definition.test.promises.internal.Events } */
		var events = $api.events.emitter();

		/** @typedef { slime.definition.test.promises.internal.Executor } Executor */
		/** @typedef { slime.definition.test.promises.internal.Identifier } Identifier */

		var ordinal = 0;

		var RegisteredPromiseConstructor = (function(NativePromiseConstructor) {
			/**
			 * @constructor
			 * @param { Executor } executor
			 */
			function RegisteredPromiseConstructor(executor) {
				console.log("Invoked RegisteredPromiseConstructor with executor", executor.toString() + " at " + new Error("Stack trace").stack);

				this.then = void(0);
				this.catch = void(0);

				/** @type { Identifier } */
				var identifier = {
					id: ++ordinal,
					executor: executor,
					promise: void(0)
				};

				events.fire("created", identifier);

				var RegisteringExecutor = function(executor) {
					return function(resolve,reject) {
						executor(
							function(value) {
								resolve(value);
							},
							function(error) {
								reject(error);
							}
						);
					}
				};

				var nativePromise = new NativePromiseConstructor(RegisteringExecutor(executor));

				var decorate = function(nativePromise,executor) {
					var rv = nativePromise.then(
						function(value) {
							events.fire("settled", identifier);
							return value;
						},
						function(error) {
							events.fire("settled", identifier);
							throw error;
						}
					);

					rv["executor"] = (executor) ? executor.toString() : void(0);
					rv["id"] = ++ordinal;

					return rv;
				}

				identifier.promise = decorate(nativePromise, executor);

				identifier.promise.then = function(onfulfilled, onrejected) {
					var rv = NativePromiseConstructor.prototype.then.call(identifier.promise, onfulfilled, onrejected);
					rv = decorate(rv, void(0));
					rv["chainedFrom"] = identifier.promise;
					return rv;
				}

				return identifier.promise;
			}
			//	Copy all properties
			for (var x in NativePromiseConstructor) {
				RegisteredPromiseConstructor[x] = NativePromiseConstructor[x];
			}
			//	Make typescript happy if above didn't work

			//	At least in Chrome, this calls Promise constructor
			RegisteredPromiseConstructor.resolve = NativePromiseConstructor.resolve;
			RegisteredPromiseConstructor.reject = NativePromiseConstructor.reject;

			RegisteredPromiseConstructor.race = NativePromiseConstructor.race;
			RegisteredPromiseConstructor.all = NativePromiseConstructor.all;
			return RegisteredPromiseConstructor;
		})(window.Promise);

		var NativePromise = window.Promise;

		window.Promise = RegisteredPromiseConstructor;

		var controlledPromiseId = 0;
		/**
		 *
		 * @param { { id: string } } [p]
		 * @returns { ReturnType<slime.definition.test.promises.Export["controlled"]> }
		 */
		var ControlledPromise = function(p) {
			var id = (p && p.id) ? p.id : String(++controlledPromiseId);
			var resolver;
			var rejector;
			var settled = function() {
				resolver = function() {
					console.log("Cannot resolve; already settled.");
				};
				rejector = function() {
					console.log("Cannot resolve; already settled.");
				};
			};
			var executor = function(resolve,reject) {
				resolver = function(value) {
					console.log("resolving ControlledPromise", id, value);
					settled();
					resolve(value);
				};
				rejector = function(error) {
					console.log("rejecting ControlledPromise", id, error);
					settled();
					reject(error);
				}
			}
			executor.toString = function() {
				return "<ControlledPromise " + id + ">";
			}
			var promise = new RegisteredPromiseConstructor(executor);
			//	TODO	seems like a race condition, how can we assume resolver and rejector have been initialized?
			return {
				//@ts-ignore
				promise: promise,
				resolve: function(value) {
					resolver(value);
				},
				reject: function(error) {
					rejector(error);
				}
			}
		};

		var RegisteredFetch = (
			function(nativeFetch) {
				var PuppetWrapper = function(promise,id) {
					var pid = "fetch " + id + ":" + ++controlledPromiseId;
					var puppet = ControlledPromise({ id: pid });
					console.log("PuppetWrapper " + pid + " - created");
					promise
						.then(function(value) {
							console.log("PuppetWrapper " + pid + " - settled - fulfilled", { promise: promise, value: value });
							puppet.resolve(value);
							return value;
						})
						.catch(function(error) {
							console.log("PuppetWrapper " + pid + " - settled - rejected", { promise: promise, error: error });
							puppet.reject(error);
							throw error;
						})
					;
					return puppet.promise;
				};

				var PromiseExecutor = function(promise) {
					var rv = function(resolve,reject) {
						promise.then(
							function(value) {
								resolve(value);
							},
							function(error) {
								reject(error);
							}
						)
					};
					rv.original = promise;
					return rv;
				};

				var ResponseWrapper = function(response) {
					var MethodWrapper = function(object,methodName) {
						var was = object[methodName];
						return function() {
							//return PuppetWrapper(was.call(object), methodName);
							/** @type { Promise<any> } */
							var promise = was.call(object);
							return new RegisteredPromiseConstructor(PromiseExecutor(promise));
						}
					};

					return Object.assign(response, {
						text: MethodWrapper(response, "text")
					});
				}

				/** @type { Window["fetch"] } */
				return function(path, init) {
					return new RegisteredPromiseConstructor(
						PromiseExecutor(
							nativeFetch(path, init).then(function(/** @type { Response } */response) {
								return ResponseWrapper(response);
							})
						)
					);
					// var puppet = ControlledPromise({ id: "fetch " + ++controlledPromiseId });
					// console.log("fetch - created");
					// //events.fire("created", puppet.promise);
					// var nativeFetch = was(path, init);
					// nativeFetch.then(function(value) {
					// 	console.log("fetch - settled - fulfilled", nativeFetch, value);
					// 	puppet.resolve(value);
					// 	return ResponseWrapper(value);
					// }).catch(function(error) {
					// 	console.log("fetch - settled - rejected", nativeFetch, error);
					// 	puppet.reject(error);
					// 	//events.fire("settled", registered);
					// 	throw error;
					// });
					// //	Doesn't like that puppet.promise is not parameterized
					// //@ts-ignore
					// return puppet.promise;
				}
				// /** @type { Window["fetch"] } */
				// return function(path, init) {
				// 	var puppet = ControlledPromise({ id: "fetch " + ++controlledPromiseId });
				// 	console.log("fetch - created");
				// 	//events.fire("created", puppet.promise);
				// 	var nativeFetch = was(path, init);
				// 	nativeFetch.then(function(value) {
				// 		console.log("fetch - settled - fulfilled", nativeFetch, value);
				// 		puppet.resolve(value);
				// 		return ResponseWrapper(value);
				// 	}).catch(function(error) {
				// 		console.log("fetch - settled - rejected", nativeFetch, error);
				// 		puppet.reject(error);
				// 		//events.fire("settled", registered);
				// 		throw error;
				// 	});
				// 	//	Doesn't like that puppet.promise is not parameterized
				// 	//@ts-ignore
				// 	return puppet.promise;
				// }
			}
		)(window.fetch);

		window.fetch = RegisteredFetch;

		var Registry = function(p) {
			var name = (p && p.name);
			console.log("Created registry", name);
			var isUnderTest = function() {
				return (name == "one") || (name == "two")
			};
			/** @type { slime.definition.test.promises.internal.Identifier[] } */
			var list = [];

			/** @type { slime.$api.event.Handler<slime.definition.test.promises.internal.Identifier> } */
			var created = function(e) {
				console.log("registering created promise with", name, e.detail);
				// if (name == "two") debugger;
				list.push(e.detail);
				if (name == "two") {
					console.log("Created; now ", list);
					// debugger;
				}
			};

			events.listeners.add("created", created);

			/**
			 *
			 * @param { slime.definition.test.promises.internal.Identifier } instance
			 */
			var remove = function(instance) {
				var index = list.indexOf(instance);
				if (index == -1) {
					// if (name == "two") {
					// 	debugger;
					// }
					console.log("Not registered with", name, instance, instance.toString());
				} else {
					console.log("Removing from registry " + name, list[index]);
					list.splice(index,1);
				}
			};

			/** @type { slime.$api.event.Handler<slime.definition.test.promises.internal.Identifier> } */
			var settled = function(e) {
				//if (e.detail.promise == controlled.promise["native"]) return;
				console.log("Settled in " + name, e.detail);
				if (isUnderTest()) {
					debugger;
				}
				remove(e.detail);
				if (isUnderTest()) {
					console.log("Removed; now " + name + ":", list);
				}
				if (list.length == 0) {
					console.log("All promises removed from registry " + name, e.detail, "resolving", controlled.promise);
					debugger;
					controlled.resolve(void(0));
				} else {
					console.log("pending in " + name, list);
				}
			}

			events.listeners.add("settled", settled);

			var controlled = ControlledPromise({ id: "Promise for Registry " + name});
			//	We used to use our own promises here and did not want the ControlledPromise to count as "registered." Now we just
			//	use the out-of-the-box Promise implementation for ControlledPromise objects.
			list = list.filter(function(item) {
				return item.promise != controlled.promise;
			});
			if (list.length) debugger;

			return {
				wait: function() {
					console.log(name, "waiting for list with length", list.length, ":", list);
					if (list.length == 0) {
						console.log("resolving empty wait", name);
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

		$export({
			NativePromise: NativePromise,
			Promise: window.Promise,
			//@ts-ignore
			controlled: ControlledPromise,
			Registry: Registry,
			console: console
		})
	}
//@ts-ignore
)($api,$export);
