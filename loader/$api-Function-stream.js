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

		$export({
			from: {
				empty: function() {
					return function() {
						return {
							next: $f.Maybe.nothing(),
							remaining: $f.Stream.from.empty()
						};
					};
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
									remaining: $f.Stream.from.empty()
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
			filter: function filter(predicate) {
				return function(stream) {
					return function() {
						while(true) {
							var current = stream.iterate();
							if (!current.next.present) {
								return {
									next: $f.Maybe.nothing(),
									remaining: $f.Stream.from.empty()
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
			},
			find: function find(predicate) {
				return $f.pipe(
					$f.Stream.filter(predicate),
					$f.Stream.first
				)
			}
		});
	}
//@ts-ignore
)($context,$export);
