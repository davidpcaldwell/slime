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
				next: $f.Maybe.nothing(),
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
								next: $f.Maybe.nothing(),
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
						next: $f.Maybe.nothing(),
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
									next: $f.Maybe.value(array[index]),
									remaining: recurse(array, index+1)
								}
							} else {
								return {
									next: $f.Maybe.nothing(),
									remaining: empty
								}
							}
						};
					}

					return ArrayStream(array, 0);
				}
			},
			first: function(stream) {
				return stream().next;
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
		});
	}
//@ts-ignore
)($context,$export);
