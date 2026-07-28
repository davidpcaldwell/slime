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
				mapping: {
					all: function(input) {
						return function(p) {
							return input();
						}
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
				},
				cache: function(cache) {
					return function(input) {
						return function() {
							var cached = cache.get();
							if (!cached.present) {
								var value = input();
								cache.set(value);
								cached = $context.Maybe.from.some(value);
							}
							return cached.value;
						}
					}
				}
			},
			Effector: {
				process: function(p) {
					return function(effect) {
						return function() {
							effect(p);
						}
					}
				},
				now: function(p) {
					return function(effect) {
						effect(p);
					}
				},
				invoke: function(p) {
					p.effector(p.command);
				}
			},
			Output: {
				nothing: function() {
					return function(p){};
				},
				process: function(p) {
					return function() {
						p.output(p.value);
					}
				},
				compose: function(os) {
					return function(p) {
						os.forEach(function(o) {
							o(p);
						});
					}
				},
				map: function(c) {
					return function(p) {
						c.output(c.map(p));
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
				},
				now: function(process) {
					process();
				}
			},
			tap: function(f) {
				return function(t) {
					f(t);
					return t;
				}
			},
			Stream: $context.stream
		}

		$export({
			impure: impure
		})
	}
//@ts-ignore
)($context,$export);
