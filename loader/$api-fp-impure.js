//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.fp.internal.impure.Context } $context
	 * @param { slime.loader.Export<slime.$api.fp.internal.impure.Exports> } $export
	 */
	function($context,$export) {
		/** @type { slime.$api.fp.impure.Exports } */
		var impure = {
			now: {
				input: function(input) {
					return input();
				},
				output: function(p, f) {
					f(p);
				},
				process: function(process) {
					process();
				}
			},
			Input: {
				from: {
					switch: function(p) {
						return function() {
							for (var i=0; i<p.length; i++) {
								var m = p[i]();
								if (m.present) return {
									present: true,
									value: m.value
								};
							}
							return {
								present: false
							};
						}
					},
					mapping: function(p) {
						return function() {
							return p.mapping(p.argument);
						}
					},
					partial: function(p) {
						return function() {
							var a = p.if();
							if (a.present) return a.value;
							return p.else();
						}
					}
				},
				value: function(v) {
					var functions = Array.prototype.slice.call(arguments,1);
					return function() {
						var rv = v;
						functions.forEach(function(f) {
							rv = f(rv);
						})
						return rv;
					}
				},
				memoized: function(f) {
					var returns;

					return function() {
						if (arguments.length > 0) throw new TypeError("Memoized functions may not have arguments.");
						//	Ignore 'this'
						if (!returns) {
							returns = { value: f.call(this) };
						}
						return returns.value;
					};
				},
				map: function(input) {
					var functions = Array.prototype.slice.call(arguments,1);
					return function() {
						var rv = input();
						functions.forEach(function(f) {
							rv = f(rv);
						});
						return rv;
					}
				},
				process: function(input, output) {
					return function() {
						output(input());
					}
				},
				//@ts-ignore
				compose: function(p) {
					return function() {
						var rv = Object.fromEntries(
							Object.entries(p).map(function(entry) {
								return [entry[0], entry[1]()];
							})
						);
						return rv;
					}
				},
				stream: function(input) {
					return function() {
						return {
							next: {
								present: true,
								value: input()
							},
							remaining: function empty() {
								return {
									next: {
										present: false
									},
									remaining: empty
								}
							}
						}
					}
				},
				supply: function(input) {
					return function(output) {
						return function() {
							output(input());
						}
					}
				}
			},
			Output: {
				process: function(p) {
					return function(output) {
						return function() {
							output(p);
						}
					}
				},
				compose: function(os) {
					return function(p) {
						os.forEach(function(o) {
							o(p);
						});
					}
				}
			},
			Process: {
				compose: function(processes) {
					return function() {
						processes.forEach(function(process) {
							process();
						});
					}
				},
				output: function(p,f) {
					return function() {
						f(p);
					}
				},
				/** @type { slime.$api.fp.impure.Exports["Process"]["create"]} */
				create: function(p) {
					return function() {
						p.output(p.input());
					}
				},
				value: function(v) {
					var functions = Array.prototype.slice.call(arguments,1);
					return function() {
						var rv = v;
						functions.forEach(function(f) {
							rv = f(rv);
						});
						return rv;
					}
				}
			},
			tap: function(f) {
				return function(t) {
					f(t);
					return t;
				}
			}
		}

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

		/** @type { slime.$api.fp.world.Exports } */
		var world = {
			Meter: {
				from: {
					flat: function(f) {
						return function(subject) {
							return function(events) {
								return f({ subject: subject, events: events });
							}
						}
					}
				},
				mapping: function(p) {
					return function(subject) {
						return $context.events.handle({
							implementation: p.meter(subject),
							handlers: p.handlers
						})
					}
				}
			},
			Means: {
				from: {
					flat: function(f) {
						return function(order) {
							return function(events) {
								f({ order: order, events: events });
							}
						}
					}
				},
				map: function(p) {
					return function(order) {
						return function(events) {
							p.means(p.order(order))(events);
						}
					}
				}
			},
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
				}
			},
			Ask: {
				input: function(handlers) {
					return function(ask) {
						return input(ask, handlers);
					}
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
			now: {
				question: function(question, argument, handlers) {
					return $context.events.handle({
						implementation: question(argument),
						handlers: handlers
					});
				},
				action: function(action, argument, handler) {
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
		}

		$export({
			impure: impure,
			world: world
		})
	}
//@ts-ignore
)($context,$export);
