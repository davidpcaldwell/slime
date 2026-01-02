//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.fp.internal.stream.Context } $context
	 * @param { slime.loader.Export<slime.$api.fp.internal.stream.Exports> } $export
	 */
	function($context,$export) {
		var $f = $context.$f;

		/** @type { slime.$api.fp.Stream<any> } */
		var empty = function() {
			return {
				next: $f.Maybe.from.nothing(),
				remaining: empty
			};
		};

		var filter = function filter(predicate) {
			return function(stream) {
				return function() {
					while(true) {
						var current = stream();
						if (!current.next.present) {
							return {
								next: $f.Maybe.from.nothing(),
								remaining: empty
							}
						}
						if (current.next.present && predicate(current.next.value)) {
							return {
								next: current.next,
								remaining: filter(predicate)(current.remaining)
							}
						} else {
							stream = current.remaining;
						}
					}
				}
			}
		};

		var first = function(stream) {
			return stream().next;
		};

		/**
		 * @template { any } T
		 * @param { slime.$api.fp.Stream<T>[] } streams
		 * @returns { slime.$api.fp.Stream<T> }
		 */
		var StreamsStream = function(streams) {
			return function() {
				if (streams.length == 0) {
					return {
						next: $f.Maybe.from.nothing(),
						remaining: empty
					}
				}
				var current = streams[0];
				var first = current();
				if (first.next.present) {
					return {
						next: first.next,
						remaining: StreamsStream([first.remaining].concat(streams.slice(1)))
					};
				} else if (streams.length > 1) {
					return StreamsStream(streams.slice(1))();
				} else {
					return current();
				}
			}
		}

		$export({
			exports: {
				from: {
					empty: function() {
						return empty;
					},
					array: function(array) {
						/**
						 * @template { any } T
						 * @param { T[] } array
						 * @param { number } index
						 * @returns { slime.$api.fp.Stream<T> }
						 */
						var ArrayStream = function recurse(array,index) {
							return function() {
								if (index < array.length) {
									return {
										next: $f.Maybe.from.some(array[index]),
										remaining: recurse(array, index+1)
									}
								} else {
									return {
										next: $f.Maybe.from.nothing(),
										remaining: empty
									}
								}
							};
						}

						return ArrayStream(array, 0);
					},
					integers: {
						range: function(p) {
							var IntRange = function recurse(p) {
								var start = p.start || 0;
								var increment = p.increment || 1;
								return function() {
									if ( (start + increment) <= p.end) {
										return {
											next: $f.Maybe.from.some(start),
											remaining: recurse({
												start: start + increment,
												end: p.end,
												increment: increment
											})
										}
									} else {
										return {
											next: $f.Maybe.from.nothing(),
											remaining: empty
										}
									}
								}
							};
							return IntRange(p);
						}
					}
				},
				first: function(stream) {
					return stream().next;
				},
				only: function(stream) {
					var rv = stream().next;
					var another = stream().remaining().next;
					if (another.present) throw new Error("Multiple elements in " + stream);
					return rv;
				},
				map: function(mapping) {
					/**
					 * @template { any } T
					 * @template { any } R
					 * @param { slime.$api.fp.Stream<T> } stream
					 * @param { (t: T) => R } mapping
					 * @returns { slime.$api.fp.Stream<R> }
					 */
					var MappedStream = function recurse(stream,mapping) {
						return function() {
							var delegate = stream();
							return {
								//	TODO	probably a better way to write this with Maybe.else
								next: (delegate.next.present) ? $context.$f.Maybe.from.some(mapping(delegate.next.value)) : $context.$f.Maybe.from.nothing(),
								remaining: recurse(delegate.remaining,mapping)
							}
						};
					}
					return function(stream) {
						if (!stream) throw new Error("No stream passed to Stream.map(mapping)");
						return MappedStream(stream,mapping);
					}
				},
				flatMap: function(mapping) {
					/**
					 * @template { any } T
					 * @template { any } R
					 * @param { slime.$api.fp.Stream<T> } outer
					 * @param { slime.$api.fp.Stream<R> } inner
					 * @param { (t: T) => slime.$api.fp.Stream<R> } mapping
					 * @returns { slime.$api.fp.Stream<R> }
					 */
					var FlatMappedStream = function recurse(outer,inner,mapping) {
						return function() {
							if (!inner) {
								var out = outer();
								if (!out.next.present) return empty();
								var rv = recurse(out.remaining, mapping(out.next.value), mapping)();
								return rv;
							} else {
								var i = inner();
								if (!i.next.present) {
									return recurse(outer, void(0), mapping)();
								} else {
									return {
										next: i.next,
										remaining: recurse(outer, i.remaining, mapping)
									}
								}
							}
						}
					};

					return function(stream) {
						return FlatMappedStream(stream,void(0),mapping);
					}
				},
				collect: function(stream) {
					var rv = [];
					var more = true;
					while(more) {
						var current = stream();
						if (current.next.present) {
							rv.push(current.next.value);
							stream = current.remaining;
						} else {
							more = false;
						}
					}
					return rv;
				},
				filter: filter,
				find: function find(predicate) {
					return $f.pipe(
						filter(predicate),
						first
					)
				},
				join: function(streams) {
					return StreamsStream(streams);
				}
			},
			impure: {
				forEach: function(f) {
					return function(stream) {
						var more = true;
						while(more) {
							var current = stream();
							if (current.next.present) {
								f(current.next.value);
								stream = current.remaining;
							} else {
								more = false;
							}
						}
					}
				}
			}
		});
	}
//@ts-ignore
)($context,$export);
