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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace stream {
		export namespace exports {
			export interface From {
				integers: {
					range: (p: {
						start?: number
						end: number
						increment?: number
					}) => Stream<number>
				}
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;
					const { $api }  = fifty.global;
					const subject = $api.fp.Stream;

					fifty.tests.exports.from = function() {
						var lessThan10 = subject.from.integers.range({ end: 10 });
						var collected = subject.collect(lessThan10);
						verify(collected).length.is(10);
						verify(collected)[0].is(0);
						verify(collected)[9].is(9);
					};
				}
			//@ts-ignore
			)(fifty);
		}
	}

	export namespace stream {
		export namespace exports {
			export interface From {
				empty: <T>() => Stream<T>
				array: <T>(ts: T[]) => Stream<T>
			}
		}
	}

	export namespace stream {
		export interface Exports {
			from: exports.From
		}
	}

	export namespace stream {
		export interface Exports {
			map: <T,R>(f: (t: T) => R) => (stream: Stream<T>) => Stream<R>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;
				const subject = $api.fp.Stream;

				fifty.tests.exports.map = function() {
					var three = subject.from.integers.range({ end: 3 });
					var zeroTwoFour = subject.map(function(n: number) { return n*2; })(three);
					var collected = subject.collect(zeroTwoFour);
					verify(collected).length.is(3);
					verify(collected)[0].is(0);
					verify(collected)[2].is(4);
				}

				fifty.tests.wip = fifty.tests.exports.map;
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace stream {
		export interface Exports {
			join: <T>(streams: Stream<T>[]) => Stream<T>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;
				const subject = $api.fp.Stream;

				fifty.tests.exports.join = function() {
					var one = subject.from.array([1,2,3]);
					var two = subject.from.array([9,10,11,12]);
					var three: Stream<number> = subject.from.array([]);
					var four = subject.from.array([99]);
					var joined = subject.join([one, two, three, four]);
					var collected = subject.collect(joined);
					verify(collected).evaluate(function(array) { return array.join(","); }).is("1,2,3,9,10,11,12,99");
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace stream {
		export interface Exports {
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

	export interface Exports {
		Stream: stream.Exports
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

				fifty.run(fifty.tests.exports);
			};
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
