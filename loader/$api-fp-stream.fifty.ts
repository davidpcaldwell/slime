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
}

namespace slime.$api.fp.stream {
	export namespace test {
		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			const { $api } = fifty.global;

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
							next: $api.fp.Maybe.from.some(start),
							remaining: streamRange(start+1, limit)
						}
					} else {
						return {
							next: $api.fp.Maybe.from.nothing(),
							remaining: emptyStream()
						}
					}
				}
			}

			function streamTo(limit: number): Stream<number> {
				return streamRange(0, limit);
			}

			var isOdd: Predicate<number> = (n: number) => n % 2 == 1;

			return {
				streamTo,
				isOdd
			}
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.from = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

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

				fifty.tests.exports.from.integers = function() {
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

	export namespace exports {
		export interface From {
			empty: <T>() => Stream<T>
			array: <T>(ts: T[]) => Stream<T>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.from.empty = function() {
					var stream = $api.fp.Stream.from.empty();
					var first = $api.fp.Stream.first(stream);
					verify(first).present.is(false);
					var collected = $api.fp.Stream.collect(stream);
					verify(collected).length.is(0);
				}

				fifty.tests.exports.from.array = function() {
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
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		from: exports.From
	}

	export interface Exports {
		first: <T>(ts: Stream<T>) => Maybe<T>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const subject = fifty.global.$api.fp.Stream;

			fifty.tests.exports.first = function() {
				var empty = subject.from.empty();
				var empty2 = subject.from.array([]);
				var one = subject.from.array(["one"]);

				verify(empty).evaluate(subject.first).present.is(false);
				verify(empty2).evaluate(subject.first).present.is(false);
				verify(one).evaluate(subject.first).present.is(true);
				var first = subject.first(one);
				if (first.present) {
					verify(first).value.is("one");
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * A function intended to return the only element of the stream (or {@link Nothing}, if the stream is empty). This function
		 * can be composed with `filter` in cases where only one match (or zero matches) is expected for the filter.
		 *
		 * This function will throw an exception if the stream has more than one element.
		 */
		only: <T>(ts: Stream<T>) => Maybe<T>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;
			const subject = $api.fp.Stream;

			fifty.tests.exports.only = function() {
				var empty: Stream<number> = subject.from.empty();
				var one = subject.from.array([1]);
				var more = subject.from.array([1,2]);

				verify(empty).evaluate(subject.only).present.is(false);
				verify(one).evaluate(subject.only).present.is(true);
				var a = $api.fp.now(one, subject.only);
				if (a.present) {
					verify(a).value.is(1);
				}
				verify(more).evaluate(subject.only).threw.type(Error);
			}
		}
	//@ts-ignore
	)(fifty);

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
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		flatMap: <T,R>(f: (t: T) => Stream<R>) => (stream: Stream<T>) => Stream<R>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;
			const subject = $api.fp.Stream;

			const returnStream = function(index: number): Stream<number> {
				var content = [
					[],
					[1,2,3],
					[],
					[4],
					[5,6],
					[]
				];
				return subject.from.array(content[index]);
			};

			fifty.tests.exports.flatMap = function() {
				var range = subject.from.integers.range({ end: 6 });
				var it = subject.flatMap(returnStream)(range);
				var collected = $api.fp.Stream.collect(it);
				verify(collected).length.is(6);
				verify(collected).evaluate(String).is("1,2,3,4,5,6");
			}
		}
	//@ts-ignore
	)(fifty);

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

	export interface Exports {
		find: {
			<W,N extends W>(predicate: TypePredicate<W,N>): (ws: Stream<W>) => Maybe<N>
			<T>(predicate: Predicate<T>): (ts: Stream<T>) => Maybe<T>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			const { streamTo, isOdd } = test.fixtures;

			fifty.tests.exports.find = function() {
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
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		filter: {
			<W,N extends W>(predicate: TypePredicate<W,N>): (ws: Stream<W>) => Stream<N>
			<T>(predicate: Predicate<T>): (ts: Stream<T>) => Stream<T>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			const { streamTo, isOdd } = test.fixtures;

			fifty.tests.exports.filter = function() {
				var rv = $api.fp.result(
					streamTo(10),
					$api.fp.pipe(
						$api.fp.Stream.filter(isOdd),
						$api.fp.Stream.collect
					)
				);
				verify(rv.join(",")).is("1,3,5,7,9");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		collect: <T>(ts: Stream<T>) => T[]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			const { streamTo } = test.fixtures;

			fifty.tests.exports.collect = function() {
				var rv = $api.fp.Stream.collect(streamTo(10));
				verify(rv.join(",")).is("0,1,2,3,4,5,6,7,8,9")
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace impure {
		export interface Exports {
			forEach: <T>(f: slime.$api.fp.impure.Output<T>) => slime.$api.fp.impure.Output<Stream<T>>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				const fixtures = slime.$api.fp.stream.test.fixtures;

				const subject = $api.fp.impure.Stream;

				fifty.tests.impure = fifty.test.Parent();

				fifty.tests.impure.forEach = function() {
					var buffer: number[] = [];

					var four = fixtures.streamTo(4);

					subject.forEach(function(number: number) {
						buffer.push(number*2);
					})(four);

					verify(buffer).length.is(4);

					verify(buffer)[0].is(0);
					verify(buffer)[1].is(2);
					verify(buffer)[2].is(4);
					verify(buffer)[3].is(6);
				};
			}
		//@ts-ignore
		)(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.run(fifty.tests.impure);
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

	export type Exports = {
		exports: slime.$api.fp.stream.Exports
		impure: slime.$api.fp.stream.impure.Exports
	};

	export type Script = slime.loader.Script<Context,Exports>
}
