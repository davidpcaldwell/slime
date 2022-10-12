//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp {
	export interface Stream<T> {
		(): {
			next: Maybe<T>,
			remaining: Stream<T>
		}
	}

	export interface Exports {
		Stream: {
			from: {
				empty: <T>() => Stream<T>
				array: <T>(ts: T[]) => Stream<T>
			}

			first: <T>(ts: Stream<T>) => Maybe<T>

			find: {
				<W,N extends W>(predicate: (w: W) => w is N): (ws: Stream<W>) => Maybe<N>
				<T>(predicate: Predicate<T>): (ts: Stream<T>) => Maybe<T>
			}

			filter: {
				<W,N extends W>(predicate: (w: W) => w is N): (ws: Stream<W>) => Stream<N>
				<T>(predicate: Predicate<T>): (ts: Stream<T>) => Stream<T>
			}

			collect: <T>(ts: Stream<T>) => T[]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.suite = function() {
				fifty.run(function testEmptyStream() {
					var stream = $api.fp.Stream.from.empty();
					var first = $api.fp.Stream.first(stream);
					verify(first).present.is(false);
					var collected = $api.fp.Stream.collect(stream);
					verify(collected).length.is(0);
				});

				fifty.run(function testArrayStream() {
					var array = [1,2,3,4];
					var stream = $api.fp.Stream.from.array(array);
					var first = $api.fp.Stream.first(stream);
					verify(first).present.is(true);
					verify(first).evaluate.property("value").is(1);
					var collected = $api.fp.Stream.collect(stream);
					verify(collected).length.is(4);
					verify(collected)[0].is(1);
					verify(collected)[1].is(2);
					verify(collected)[2].is(3);
					verify(collected)[3].is(4);
				});

				function streamRange(start: number, limit: number): Stream<number> {
					function emptyStream(): Stream<number> {
						return function() {
							return {
								next: null,
								remaining: emptyStream()
							}
						}
					}

					return function() {
						if (start < limit) {
							return {
								next: $api.fp.Maybe.value(start),
								remaining: streamRange(start+1, limit)
							}
						} else {
							return {
								next: $api.fp.Maybe.nothing(),
								remaining: emptyStream()
							}
						}
					}
				}

				function streamTo(limit: number): Stream<number> {
					return streamRange(0, limit);
				}

				var isOdd: Predicate<number> = (n: number) => n % 2 == 1;

				fifty.run(function testStream() {
					var rv = $api.fp.Stream.collect(streamTo(10));
					verify(rv.join(",")).is("0,1,2,3,4,5,6,7,8,9")
				});

				fifty.run(function testFilter() {
					var rv = $api.fp.result(
						streamTo(10),
						$api.fp.pipe(
							$api.fp.Stream.filter(isOdd),
							$api.fp.Stream.collect
						)
					);
					verify(rv.join(",")).is("1,3,5,7,9");
				});

				fifty.run(function testFind() {
					var firstOdd = $api.fp.result(
						streamTo(10),
						$api.fp.Stream.find(isOdd)
					);
					verify(firstOdd).present.is(true);
					verify(firstOdd).evaluate.property("value").is(1);

					var firstOver10 = $api.fp.result(
						streamTo(10),
						$api.fp.Stream.find(function(v) { return v > 10; })
					);
					verify(firstOver10).present.is(false);
				});
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.$api.fp.internal.stream {
	export interface Context {
		$f: {
			Maybe: slime.$api.fp.Exports["Maybe"],
			pipe: slime.$api.fp.Exports["pipe"]
		}
	}

	export type Exports = slime.$api.fp.Exports["Stream"];

	export type Script = slime.loader.Script<Context,Exports>
}
