//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.definition.unit.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.definition.unit.Exports } $exports
	 */
	function($context,$loader,$exports) {
		/** @type { (message: string, p: any) => void } */
		var log = ($context.log) ? $context.log : function(){};

		/**
		 * @type { ObjectConstructor["defineProperty"] }
		 */
		var defineProperty = (function() { return this.Object.defineProperty; })();

		/** @type { slime.definition.unit.Verify.Factory } */
		var Verify = $loader.file("verify.js");

		$exports.Verify = Verify;

		/** @type { slime.definition.unit.internal.Scope } */
		var TestExecutionProcessor = $loader.file("unit-TestExecutionProcessor.js", {
			Verify: Verify,
			defineProperty: defineProperty
		});

		$exports.TestExecutionProcessor = TestExecutionProcessor;

		(function() {
			var copy = function(o) {
				var rv = {};
				for (var x in o) {
					rv[x] = o[x];
				}
				return rv;
			}

			var Part = function(definition,context) {
				//	TODO	what if caller does not use 'new'?
				var events = $api.Events({
					source: this,
					parent: (context && context.events) ? context.events : null
				});

				this.id = (context) ? context.id : null;

				this.name = (function() {
					if (definition && definition.name) return definition.name;
					if (context && context.id) return context.id;
					if (!context) return null;
				})();

				var find = (function(property) {
					if (definition && definition[property]) return definition[property];
					if (this[property] && property != "promise") {
						return $api.deprecate(function() {
							return this[property];
						}).call(this);
					}
				}).bind(this);

				var EVENT = (function() {
					return { id: (context && context.id ) ? context.id : null, name: this.name };
				}).bind(this);

				var destroy = (function(scope) {
					try {
						var destroy = find("destroy");
						if (destroy) destroy.call(this,scope);
					} catch (e) {
						//	TODO	what to do on destroy error?
						// vscope.error(e);
					}
				}).bind(this);

				//	Do not use old automatically-configured listeners property of event source; rather, use new listeners
				//	property of events itself
				this.listeners = events.listeners;

				return {
					events: events,
					scope: TestExecutionProcessor({ events: events }),
					create: (function() {
						if (definition && definition.create) {
							$api.deprecate(function() {
								definition.create.call(this);
							}).call(this);
						}
					}).bind(this),
					find: find,
					before: (function(p) {
						if (!p) p = {};
						if (!p.scope) p.scope = {};
						events.fire("scenario", { start: EVENT() });
						var local = copy(p.scope);
						return { scope: local };
					}).bind(this),
					initialize: (function(scope) {
						var initialize = find("initialize");
						if (initialize) {
							try {
								initialize(scope);
							} catch (e) {
								//	TODO	not handling destroy here
								events.fire("test", {
									success: false,
									message: "Uncaught exception in initializer: " + e,
									error: e
								});
								return true;
							}
						}
					}).bind(this),
					after: (function(success,scope) {
						events.fire("scenario", { end: EVENT(), success: success });
						//	TODO	if initialize error, should we try to destroy? Some portion of initialize may have executed ...
						destroy(scope);
						return success;
					}).bind(this)
				};
			}

			var Scenario = function(o,context) {
				var part = Part.apply(this,arguments);

				this.fire = function() {
					part.events.fire.apply(part.events,arguments);
				}

				var createVerify = function(vscope,promises) {
					var verify = Verify(function(f) {
						vscope.test(f);
					});
					verify.test = $api.deprecate(function() {
						return vscope.test.apply(this,arguments);
					});
					verify.suite = $api.deprecate(function(o) {
						var suite = new $exports.Suite(o);
						var fire = (function(e) {
							this.scope.fire(e.type,e.detail);
						}).bind(this);
						suite.listeners.add("scenario",fire);
						suite.listeners.add("test",fire);
						suite.run();
					});
					verify.scenario = function(o) {
						var suite = new $exports.Suite({
							parts: {
								scenario: o
							}
						});
						var fire = (function(e) {
							this.scope.fire(e.type,e.detail);
						}).bind(this);
						suite.listeners.add("scenario",fire);
						suite.listeners.add("test",fire);
						if (!promises) {
							suite.run();
						} else {
							if (o.promise) {
								promises.push(suite.promise());
							} else {
								suite.run();
							}
						}
					};
					verify.fire = $api.deprecate(function(type,detail) {
						vscope.fire(type,detail);
					});
					verify.scope = vscope;
					return verify;
				}

				//	Satisfy TypeScript
				this.listeners = this.listeners;

				this.run = function(p,next) {
					var local = part.before(p).scope;

					//	TODO	compare below initialize with one used in part
					var vscope = part.scope;

					if (next) {
						if (part.find("next")) {
							part.find("next")(function() {
								var result = part.after(vscope.success,local);
								next(result);
							})
						}
						this.listeners.add("scenario", function(e) {
							console.log("self scenario event", e);
						})
					}
					var error = part.initialize(local);

					if (error) {
						vscope.fail();
					} else {
						var checkForScopeFailure = function(e) {
							vscope.checkForFailure(e);
						};
						this.listeners.add("scenario", checkForScopeFailure);
						this.listeners.add("test", checkForScopeFailure);

						var verify = createVerify(vscope);

						try {
							//	TODO	execute is apparently mandatory
							var execute = part.find("execute");
							var promise = part.find("promise");
							if (!execute) throw new Error("execute not found in " + o);
							if (!promise || !next) {
								execute.call(this,local,verify);
							}
						} catch (e) {
							vscope.error(e);
						}
					}

					if (!next) {
						return part.after(vscope.success,local);
					} else if (!part.find("next")) {
						next(part.after(vscope.success,local));
					} else {
						if (promise) {
							promise.call(this,local,verify).then(function(result) {
								next(result);
							});
						} else {
							part.find("next")(next);
						}
					}
				}

				this.promise = function scenarioPromise(p) {
					var Promise = $context.api.Promise();
					var local = part.before(p).scope;

					//	TODO	compare below initialize with one used in part
					var vscope = part.scope;

					var error = part.initialize(local);

					if (error) {
						vscope.fail();
						return Promise.resolve(false);
					} else {
						var checkForScopeFailure = function(e) {
							vscope.checkForFailure(e);
						};
						this.listeners.add("scenario", checkForScopeFailure);
						this.listeners.add("test", checkForScopeFailure);

						var promises = [];
						var verify = createVerify(vscope,promises);

						var execute = part.find("execute");
						var promise = part.find("promise");

						var self = this;
						var rv = new Promise(function(resolve,reject) {
							if (execute && !promise) {
								execute.call(self,local,verify);
							} else if (promise) {
								promises.unshift(promise.call(self,local,verify));
							} else {
								throw new Error();
							}
							Promise.all(promises).then(function() {
								part.after(vscope.success,local);
								resolve(vscope.success);
							});
						});

						return rv;
					}
				}

				part.create();
			}

			/** @constructor */
			var Suite = function Suite(c,context) {
				this.listeners = void(0);

				var part = Part.apply(this,arguments);

				var events = part.events;

				var parts = {};

				var addPart = function(id,definition) {
					var type = (definition && definition.parts) ? Suite : Scenario;
					parts[id] = new type(definition,{ id: id, events: events });
				}

				if (c && c.parts) {
					for (var x in c.parts) {
						addPart(x,c.parts[x]);
					}
				}

				var getParts = function() {
					var rv = {};
					for (var x in parts) {
						rv[x] = parts[x];
					}
					return rv;
				}

				defineProperty(this, "parts", {
					get: getParts
				});

				this.getParts = $api.deprecate(getParts);

				this.part = function(id,definition) {
					addPart(id,definition);
				};

				this.run = function(p,next) {
					var scope = part.before(p).scope;
					var path = (p && p.path) ? p.path : [];
					var success = true;
					var error = part.initialize(scope);
					if (error) {
						success = false;
					} else {
						if (path.length == 0) {
							if (next) {
								var keys = [];
								for (var x in parts) {
									keys.push(x);
								}
								if ($context.api && $context.api.Promise) {
									var Promise = $context.api.Promise();
									var createPartPromise = function(x) {
										return function() {
											return new Promise(function(resolve,reject) {
												var subscope = copy(scope);
												resolve(parts[x].run({
													scope: subscope,
													path: []
												}));
											});
										};
									};
									var promise = Promise.resolve();
									for (var i=0; i<keys.length; i++) {
										promise = promise.then(createPartPromise(keys[i])).then(function(result) {
											if (!result) success = false;
											return Promise.resolve();
										});
									}
									promise.then(function() {
										log("Done with suite", this);
										next(success);
									});
								} else {
									var index = 0;
									var proceed = function recurse(result) {
										if (result === false) success = false;
										if (index == keys.length) {
											part.after(success,scope);
											next(success);
										} else {
											var x = keys[index++];
											var subscope = copy(scope);
											parts[x].run({
												scope: subscope,
												path: []
											},recurse);
										}
									};
									proceed();
								}
							} else {
								for (var x in parts) {
									var result = parts[x].run({
										scope: copy(scope),
										path: []
									});
									if (!result) {
										success = false;
									}
								}
							}
						} else {
							var child = parts[path[0]];
							if (!child) {
								throw new Error("No child named " + path[0] + " when trying to find [" + path.join("/") + "]; parts are " + Object.keys(parts));
							}
							var result = child.run({
								scope: copy(scope),
								path: path.slice(1)
							},next);
							if (!result) {
								success = false;
							}
						}
					}
					if (!next) return part.after(success,scope);
				}

				if ($context.api && $context.api.Promise) {
					this.promise = function suitePromise(p) {
						var Promise = $context.api.Promise();
						//	TODO	allow p.path, for compatibility and to allow partial suites to be run
						return new Promise(function(resolve,reject) {
							var scope = part.before(p).scope;

							var success = true;
							var promise = Promise.resolve();

							var error = part.initialize(scope);
							if (error) {
								success = false;
							} else {
								var partPromiseFactory = function(x) {
									return function() {
										return parts[x].promise({
											scope: copy(scope),
											path: []
										});
									}
								};

								for (var x in parts) {
									promise = promise.then(partPromiseFactory(x)).then(function(result) {
										if (!result) success = false;
									})
								}
							}

							promise.then(function() {
								part.after(success,scope);
								resolve(success);
							});
						});
					}
				}

				this.scenario = $api.deprecate(function(id,p) {
					addPart(id,p);
				});

				this.suite = $api.deprecate(function(id,p) {
					addPart(id,p);
				});

				part.create();
			};

			$exports.Scenario = Scenario;
			$exports.Suite = Suite;
		})();

		$exports.getStructure = function getStructure(part) {
			var rv = {
				id: part.id,
				name: part.name
			};
			if (part.parts) {
				var parts = part.parts;
				rv.parts = {};
				for (var x in parts) {
					rv.parts[x] = getStructure(parts[x]);
				}
			}
			return rv;
		};

		/**
		 * @param { slime.definition.unit.View.Argument } o
		 */
		$exports.View = function(o) {
			var On = function(implementation) {
				/**
				 * @param { slime.definition.unit.Event.Scenario.Detail } detail
				 * @returns { detail is slime.definition.unit.Event.Scenario.Start }
				 */
				var isStart = function(detail) {
					return Boolean(detail["start"])
				};

				/**
				 *
				 * @type { slime.definition.unit.View["on"]["scenario"] }
				 * @param { $api.Event<slime.definition.unit.Event.Scenario.Detail> } e
				 */
				var scenario = function(e) {
					if (isStart(e.detail)) {
						if (implementation.start) {
							implementation.start(e.detail.start);
						}
					} else if (e.detail.end) {
						if (implementation.end) {
							implementation.end(e.detail.end, e.detail.success);
						}
					}
				};

				this.scenario = scenario;

				this.test = function(e) {
					if (implementation.test) implementation.test(e.detail);
				}
			};

			/**
			 *
			 * @param { $api.Events } scenario
			 * @param { slime.definition.unit.View.Argument } implementation
			 */
			var addConsoleListener = function(scenario,implementation) {
				if (typeof(implementation) == "function") {
					scenario.listeners.add("scenario", implementation);
					scenario.listeners.add("test", implementation);
				} else if (implementation && typeof(implementation) == "object") {
					var on = new On(implementation);
					scenario.listeners.add("scenario", on.scenario);
					scenario.listeners.add("test", on.test);
				}
			};

			/**
			 *
			 * @param { $api.Events } scenario
			 */
			var listen = function(scenario) {
				addConsoleListener(scenario,o);
			};

			var on;
			if (typeof(o) == "object") {
				on = new On(o);
			} else if (typeof(o) == "function") {
				on = {
					scenario: o,
					test: o
				};
			}

			return {
				listen: listen,
				on: on
			}
		};

		$exports.JSON = {
			Encoder: function(o) {
				var handler = (function() {
					/**
					 *
					 * @param { slime.definition.unit.View.Error } error
					 */
					var jsonError = function(error) {
						if (error) {
							return {
								type: error.type,
								message: error.message,
								stack: error.stack
							}
						} else {
							return void(0);
						}
					}

					/**
					 * @type { slime.definition.unit.View.Handler }
					 */
					var rv = {
						start: function(scenario) {
							o.send(JSON.stringify({ type: "scenario", detail: { start: { name: scenario.name } } }));
						},
						test: function(result) {
							o.send(JSON.stringify({
								type: "test",
								detail: {
									success: result.success,
									message: result.message,
									error: jsonError(result.error)
								}
							}));
						},
						end: function(scenario,success) {
							o.send(
								JSON.stringify({
									type: "scenario",
									detail: { end: { name: scenario.name }, success: success }
								})
							);
						}
					};
					return rv;
				})();

				return $exports.View(handler);
			},

			Decoder: function() {
				this.listeners = void(0);

				var events = $api.Events({ source: this });

				this.decode = function(string) {
					var json = JSON.parse(string);
					events.fire(json.type, json.detail);
				}
			}
		};
	}
//@ts-ignore
)($context,$loader,$exports)
