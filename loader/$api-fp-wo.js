//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.fp.internal.world.Context } $context
	 * @param { slime.loader.Export<slime.$api.fp.internal.world.Exports> } $export
	 */
	function($context,$export) {
		var input = function(ask, handler) {
			return function() {
				return $context.events.handle({
					implementation: ask,
					handlers: handler
				});
			}
		};

		var oldAsk = function(f) {
			return function(handlers) {
				return $context.events.handle({
					implementation: f,
					handlers: handlers
				})
			}
		};

		var identity = function(p) { return p; }

		/** @type { slime.$api.fp.world.Exports } */
		var world = {
			Sensor: {
				from: {
					flat: function(f) {
						return function(subject) {
							return function(events) {
								return f({ subject: subject, events: events });
							}
						}
					}
				},
				mapping: function(handlers) {
					return function(sensor) {
						return function(subject) {
							var question = sensor(subject);
							return $context.events.handle({
								implementation: question,
								handlers: handlers
							});
						}
					}
				},
				subject: function(f) {
					return function(sensor) {
						return function(subject) {
							return sensor(f(subject));
						}
					}
				},
				reading: function(f) {
					return function(sensor) {
						return function(subject) {
							return function(events) {
								return f(sensor(subject)(events));
							}
						}
					}
				},
				map: function(p) {
					var mapSubject = p.subject || identity;
					var mapReading = p.reading || identity;
					return function(subject) {
						return function(events) {
							return mapReading(p.sensor(mapSubject(subject))(events));
						}
					}
				},
				input: function(p) {
					return function() {
						var question = p.sensor(p.subject);
						return $context.events.handle({
							implementation: question,
							handlers: p.handlers
						});
					}
				},
				now: function(p) {
					var question = p.sensor(p.subject);
					return $context.events.handle({
						implementation: question,
						handlers: p.handlers
					});
				},
				old: {
					mapping: function(p) {
						return function(subject) {
							return $context.events.handle({
								implementation: p.sensor(subject),
								handlers: p.handlers
							})
						}
					}
				},
				api: {
					simple: function(toSensor) {
						return {
							wo: toSensor,
							simple: $context.now(toSensor, world.Sensor.mapping())
						}
					},
					maybe: function(toSensor) {
						return {
							wo: toSensor,
							maybe: $context.now(toSensor, world.Sensor.mapping()),
							simple: $context.now(
								toSensor,
								world.Sensor.mapping(),
								$context.Partial.impure.exception(
									function(p) {
										return new Error("In Sensor.api.maybe, when executing simple, maybe is nothing for argument " + String(p));
									}
								)
							)
						}
					}
				}
			},
			Means: (
				function() {
					/** @type { slime.$api.fp.world.Exports["Means"]["process"] } */
					var toProcess = function(p) {
						return function() {
							var action = p.means(p.order);
							$context.events.handle({
								implementation: action,
								handlers: p.handlers
							});
						}
					};

					return {
						from: {
							flat: function(f) {
								return function(order) {
									return function(events) {
										f({ order: order, events: events });
									}
								}
							}
						},
						order: (
							function() {
								return function(mapping) {
									return function(means) {
										return function(order) {
											return means(mapping(order));
										};
									}
								};
							}
						)(),
						map: function(p) {
							return function(order) {
								return function(events) {
									p.means(p.order(order))(events);
								}
							}
						},
						process: toProcess,
						now: $context.pipe(toProcess, $context.impure.Process.now),
						output: function(p) {
							return function(o) {
								var action = p.means(o);
								$context.events.handle({
									implementation: action,
									handlers: p.handlers
								});
							}
						},
						effector: function(handlers) {
							return function(means) {
								if (typeof(means) != "function") throw new TypeError("Required: means function to map.");
								return function(output) {
									$context.events.handle({
										implementation: means(output),
										handlers: handlers
									});
								}
							}
						},
						api: {
							simple: function(means) {
								return {
									wo: means,
									simple: $context.now(means, world.Means.effector())
								}
							}
						}
					};
				}
			)(),
			Process: {
				action: function(p) {
					return function() {
						return $context.events.handle({
							implementation: p.action(p.argument),
							handlers: p.handlers
						});
					}
				}
			},
			Question: {
				pipe: function(a,q) {
					return function(n) {
						return q(a(n));
					}
				},
				map: function(q,m) {
					return function(p) {
						return function(events) {
							var rv = q(p)(events);
							return m(rv);
						}
					}
				},
				wrap: function(a,q,m) {
					return world.Question.map(
						world.Question.pipe(a, q),
						m
					);
				},
				now: function(p) {
					return $context.events.handle({
						implementation: p.question,
						handlers: p.handlers
					});
				},
				thunk: function(handlers) {
					return function(ask) {
						return input(ask, handlers);
					}
				}
			},
			Action: {
				tell: function(p) {
					return function(action) {
						return action(p);
					}
				},
				output: function(handler) {
					return function(action) {
						return function(argument) {
							$context.events.handle({
								implementation: action(argument),
								handlers: handler
							});
						}
					}
				},
				pipe: function(mapping) {
					return function(action) {
						return function(argument) {
							return action(mapping(argument));
						}
					}
				},
				process: function(h) {
					return function(a) {
						return function() {
							$context.events.handle({
								implementation: a,
								handlers: h
							});
						}
					}
				},
				old: {
					process: function(p) {
						return function() {
							$context.events.handle({
								implementation: p.action,
								handlers: p.handlers
							});
						}
					}
				},
				now: function(p) {
					$context.events.handle({
						implementation: p.action,
						handlers: p.handlers
					});
				}
			},
			mapping: function(question, handlers) {
				return function(p) {
					return $context.events.handle({
						implementation: question(p),
						handlers: handlers
					});
				}
			},
			output: function(action, handler) {
				return function(p) {
					$context.events.handle({
						implementation: action(p),
						handlers: handler
					});
				};
			},
			input: input,
			process: function(tell, handler) {
				return function() {
					$context.events.handle({
						implementation: tell,
						handlers: handler
					});
				}
			},
			events: (
				function() {
					var events = function(handlers) {
						var it = function(implementation) {
							return function() {
								return $context.events.handle({
									implementation: implementation,
									handlers: handlers
								});
							}
						};

						return {
							action: it,
							question: it
						};
					};

					return {
						handle: events,
						ignore: events({})
					};
				}
			)(),
			now: {
				question: function(question, argument, handlers) {
					return $context.events.handle({
						implementation: question(argument),
						handlers: handlers
					});
				},
				action: function(action, argument, handler) {
					if (!action) throw new TypeError("Required: 'action' as argument 0");
					$context.events.handle({
						implementation: action(argument),
						handlers: handler
					});
				},
				tell: function(tell, handler) {
					$context.events.handle({
						implementation: tell,
						handlers: handler
					});
				},
				ask: function(ask, handlers) {
					return $context.events.handle({
						implementation: ask,
						handlers: handlers
					});
				}
			},
			api: {
				single: function(f) {
					return function(p) {
						return function(e) {
							return f({ argument: p, events: e });
						}
					}
				}
			},
			execute: function(tell, handler) {
				$context.events.handle({
					implementation: tell,
					handlers: handler
				});
			},
			old: {
				ask: oldAsk,
				tell: oldAsk
			}
		};

		$export({
			world: world
		})
	}
//@ts-ignore
)($context,$export);
