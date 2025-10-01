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
		/** @typedef { slime.definition.test.promises.internal.Dependency } Dependency */

		var ordinal = 0;

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

		/**
		 *
		 * @param { Executor } executor
		 * @param { Identifier } identifier
		 * @returns { Executor }
		 */
		var RegisteringExecutor = function(executor, identifier) {
			return function(resolve,reject) {
				executor(
					function(value) {
						resolve(value);
						if (!identifier.settled) {
							identifier.settled = true;
							events.fire("settled", identifier);
						}
					},
					function(error) {
						reject(error);
						if (!identifier.settled) {
							identifier.settled = true;
							events.fire("settled", identifier);
						}
					}
				);
			}
		};

		class MyPromise extends Promise {
			//@ts-ignore
			#identifier;

			constructor(executor) {
				/** @type { Identifier } */
				var identifier = {
					id: ++ordinal,
					executor: executor,
					settled: false
				};
				//events.fire("created", identifier);
				super(RegisteringExecutor(executor, identifier));
				this.#identifier = identifier;
				identifier["code"] = identifier.executor.toString();
				this["id"] = identifier.id;
			}

			then(onfulfilled,onrejected) {
				var defaulted = super.then(onfulfilled,onrejected);
				/** @type { Dependency } */
				var dependency = {
					on: this.#identifier,
					promise: this,
					from: {
						id: defaulted["id"],
						onfulfilled: (onfulfilled) ? onfulfilled.toString() : void(0),
						onrejected: (onrejected) ? onrejected.toString() : void(0),
						promise: defaulted
					}
				}
				defaulted["dependency"] = dependency;
				if (!this.#identifier.settled) {
					events.fire("needed", dependency);
				}
				return defaulted;
			}
		}

		var NativePromise = window.Promise;

		window.Promise = MyPromise;

		/**
		 *
		 * @param { { id: () => string } } [p]
		 * @returns { ReturnType<slime.definition.test.promises.Export["controlled"]> }
		 */
		var ControlledPromise = function(p) {
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
			var id;
			var executor = function(resolve,reject) {
				resolver = function(value) {
					console.log("resolving ControlledPromise " + executor.toString(), id, value);
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
				return "<ControlledPromise " + id + " for " + p.id() + ">";
			}
			//var MainConstructor = RegisteredPromiseConstructor;
			//	var MainConstructor = MyPromise;
			var MainConstructor = NativePromise;
			var promise = new MainConstructor(executor);
			promise["id"] = ++ordinal;
			id = promise["id"];
			promise["controlled"] = executor.toString();
			//var id = (p && p.id) ? p.id : String(++controlledPromiseId);
			//	TODO	seems like a race condition, how can we assume resolver and rejector have been initialized?
			return {
				//@ts-ignore
				toString: function() {
					return executor.toString()
				},
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
				var ResponseWrapper = function(response) {
					var MethodWrapper = function(object,methodName) {
						var was = object[methodName];
						return function() {
							//return PuppetWrapper(was.call(object), methodName);
							/** @type { Promise<any> } */
							var promise = was.call(object);
							return new MyPromise(PromiseExecutor(promise));
						}
					};

					return Object.assign(response, {
						text: MethodWrapper(response, "text")
					});
				}

				/** @type { Window["fetch"] } */
				return function(path, init) {
					return new MyPromise(
						PromiseExecutor(
							nativeFetch(path, init).then(function(/** @type { Response } */response) {
								return ResponseWrapper(response);
							})
						)
					);
				}
			}
		)(window.fetch);

		window.fetch = RegisteredFetch;

		var Registry = function(p) {
			var name = (p && p.name);

			console.log("Created registry: " + name);

			/** @type { slime.definition.test.promises.internal.Dependency[] } */
			var dependencies = [];

			/** @type { Promise<any>[] } */
			var external = [];

			/** @type { slime.$api.event.Handler<slime.definition.test.promises.internal.Dependency> } */
			var needed = function(e) {
				var it = e.detail;
				if (!it.on.settled) {
					if (external.indexOf(it.promise) == -1) {
						dependencies.push(e.detail);
					} else {
						debugger;
					}
				}
				console.log("Needed in " + name, it, "now", dependencies.slice());
			};

			events.listeners.add("needed", needed);

			/**
			 *
			 * @param { slime.definition.test.promises.internal.Identifier } settled
			 */
			var remove = function(settled) {
				dependencies = dependencies.filter(function(dependency) {
					if (dependency.on == settled) {
						console.log("Removing dependency", dependency.on, "because", settled, "settled");
						return false;
					}
					return true;
				});
			};

			/** @type { slime.$api.event.Handler<slime.definition.test.promises.internal.Identifier> } */
			var settled = function(e) {
				//if (e.detail.promise == controlled.promise["native"]) return;
				console.log("Promise " + e.detail.id + " settled in " + name, e.detail);
				remove(e.detail);
				console.log("Settled", e.detail, "now", dependencies.slice());
				if (dependencies.length == 0) {
					console.log("All dependencies removed from registry " + name, e.detail, "resolving", controlled.promise);
					debugger;
					controlled.resolve(void(0));
				} else {
					console.log("still waiting in " + name, dependencies.slice());
				}
			}

			events.listeners.add("settled", settled);

			var controlled = ControlledPromise({ id: function() { return "Promise for Registry " + name }});
			//	We used to use our own promises here and did not want the ControlledPromise to count as "registered." Now we just
			//	use the out-of-the-box Promise implementation for ControlledPromise objects.
			// list = list.filter(function(item) {
			// 	return item.promise != controlled.promise;
			// });
			if (dependencies.length) debugger;

			return {
				wait: function() {
					console.log(name, "waiting for list with length", dependencies.length, ":", dependencies.slice());
					if (dependencies.length == 0) {
						debugger;
						console.log("resolving empty wait", name);
						controlled.resolve(void(0));
					}
					return controlled.promise.then(function() {
						console.log("controlled promise was resolved for " + name + "; proceeding.");
						events.listeners.remove("needed", needed);
						events.listeners.remove("settled", settled);
					});
				},
				external: function(promise) {
					external.push(promise);
				},
				test: {
					list: function() {
						return dependencies;
					},
					clear: function() {
						dependencies.splice(0,dependencies.length);
					},
					setName: function(value) {
						console.log("set name of " + name + " to " + value);
						name = value;
					}
				}
			}
		};

		$export({
			NativePromise: NativePromise,
			Promise: window.Promise,
			//@ts-ignore
			controlled: function(p) {
				return ControlledPromise({ id: function() { return (p && p.id) ? p.id : void(0); }})
			},
			Registry: Registry,
			console: console
		})
	}
//@ts-ignore
)($api,$export);
