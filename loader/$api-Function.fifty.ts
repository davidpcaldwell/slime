//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
	export interface Global {
		fp: slime.$api.fp.Exports
	}
}

/**
 * The {@link slime.$api.fp.Exports | Exports} member of this namespace is available as `$api.fp` in all scripts loaded by the
 * SLIME loader.
 */
namespace slime.$api.fp {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type Mapping<P,R> = (p: P) => R
	export type Transform<T> = Mapping<T,T>

	/**
	 * A type definition that can be attached to the `$api.fp.identity` function to create a function that acts as a type hint
	 * for pipelining.
	 */
	export type Identity<T> = Mapping<T,T>

	export type Lazy<T> = () => T

	export type Predicate<T> = (t: T) => boolean
	/** @deprecated Use {@link Predicate}. */
	export type Filter<T> = (t: T) => boolean

	export interface Exports {
		identity: <T>(t: T) => T

		/**
		 * A function that can be declared as type {@link slime.js.Cast | `slime.js.Cast<T>`} and cast any value to `T`.
		 */
		cast: <T>(t: any) => T

		type: (v: any) => string
	}

	export interface Exports {
		pipe: Pipe
	}

	export interface Exports {
		split: <P,R>(functions: { [k in keyof R]: (p: P) => R[k] }) => (p: P) => R
	}

	export interface Exports {
		now: {
			/**
			 * Returns the result of invoking a function. `invoke(p, f)` is syntactic sugar for `f(p)` in situations where
			 * writing the parameter before the function lends clarity (for example, if the function is a pipeline created by
			 * `pipe`).
			 */
			invoke: Invoke
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.now = function() {
				var f = function(i: number): string {
					return String(i);
				};

				var g = function(s: string): string {
					return "g" + s;
				};

				var result = $api.fp.now.invoke(2, f);
				verify(result).is("2");

				var result2 = $api.fp.now.invoke(2, f, g);
				verify(result2).is("g2");
			};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * @deprecated Use {@link Exports["now"]["invoke"] | `$api.fp.now.invoke`}.
		 */
		result: Invoke
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			fifty.tests.result = function() {
				var times = function(x: number) {
					return function(v: number) {
						return v * x;
					}
				};

				var plus = function(x: number) {
					return function(v: number) {
						return v + x;
					}
				};

				var x = fifty.global.$api.fp.result(
					2,
					fifty.global.$api.fp.pipe(
						times(3),
						plus(4)
					)
				);
				verify(x).is(10);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * @param name A property name.
		 * @return A function that returns the named property of its argument.
		 */
		property: <T,K extends keyof T>(name: K) => (t: T) => T[K]
	}

	export interface Exports {
		/**
		 * Given a property key, creates a function that will operate on objects with the semantics of the optional chaining
		 * operator (`?.`). If the value passed to the returned function is `null` or undefined, the returned function will return
		 * undefined; if the value passed to the returned function is an object, the value of the property specified by the
		 * given property key will be returned.
		 *
		 * @param k a property key
		 * @returns A function that returns the given property of its argument, or undefined if its argument is [nullish](https://developer.mozilla.org/en-US/docs/Glossary/Nullish).
		 */
		 optionalChain: <T,K extends keyof T>(k: K) => (t: T) => T[K]
	}

	export interface Exports {
		is: <T>(value: T) => fp.Predicate<T>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.is = function() {
				var is2 = fifty.global.$api.fp.is(2);

				verify(is2(2)).is(true);
				//@ts-ignore
				verify(is2("2")).is(false);
				verify(is2(3)).is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * @deprecated Replaced by `Input.value` and `mapAllTo`
		 * @param t
		 * @returns
		 */
		returning: <T>(t: T) => () => T

		/**
		 * @deprecated Replaced by `mapping.all`.
		 */
		mapAllTo: <P,R>(r: R) => (p: P) => R

		mapping: {
			all: <P,R>(r: R) => (p: P) => R
		}

		conditional: {
			<T,R>(p: { condition: (t: T) => boolean, true: (t: T) => R, false: (t: T) => R }): (t: T) => R
		}

		Boolean: {
			map: <T>(p: { true: T, false: T }) => (b: boolean) => T
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.string = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface String {
			split: (delimiter: string) => (string: string) => string[]
			repeat: (count: number) => (string: string) => string
			toUpperCase: (string: string) => string
			match: (pattern: RegExp) => (string: string) => RegExpMatchArray

			startsWith: (searchString: string, startPosition?: number) => Predicate<string>
			endsWith: (searchString: string, endPosition?: number) => Predicate<string>
		}
	}

	export namespace exports {
		export interface String {
			replace: {
				(searchValue: RegExp, replaceValue: string): (p: string) => string;
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.string.replace = function() {
					var replacer = $api.fp.string.replace(/xmas/i, "Christmas");
					var input = "Twas the night before Xmas...";
					var output = "Twas the night before Christmas...";
					verify(input).evaluate(replacer).is(output);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface String {
			leftPad: (p: {
				length: number

				/** A string with which to pad. Defaults to the space (`" "`) character. */
				padding?: string
			}) => (original: string) => string

			rightPad: (p: {
				length: number

				/** A string with which to pad. Defaults to the space (`" "`) character. */
				padding?: string
			}) => (original: string) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.string.leftPad = function() {
					var lpad4 = $api.fp.string.leftPad({ length: 4 });
					var lpad4zero = $api.fp.string.leftPad({ length: 4, padding: "0" });

					verify("1").evaluate(lpad4).is("   1");
					verify("1").evaluate(lpad4zero).is("0001");
					verify("11111").evaluate(lpad4).is("11111");
				}

				fifty.tests.exports.string.rightPad = function() {
					var pad4 = $api.fp.string.rightPad({ length: 4 });
					var pad4zero = $api.fp.string.rightPad({ length: 4, padding: "0" });

					verify("1").evaluate(pad4).is("1   ");
					verify("1").evaluate(pad4zero).is("1000");
					verify("11111").evaluate(pad4).is("11111");
				}
			}
		//@ts-ignore
		)(fifty);

	}

	/**
	 * This object is available as `$api.fp` in all scripts loaded by the SLIME loader.
	 */
	export interface Exports {
		string: exports.String
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.string = function() {
				var subject = fifty.global.$api.fp.string;

				fifty.run(function repeat() {
					var one = fifty.global.$api.fp.string.repeat(1)("foo");
					fifty.verify(one).is("foo");
					var three = fifty.global.$api.fp.string.repeat(3)("foo");
					fifty.verify(three).is("foofoofoo");
					var zero = fifty.global.$api.fp.string.repeat(0)("foo");
					fifty.verify(zero).is("");
				});

				fifty.run(function match() {
					var one = subject.match(/foo(\d)bar(\d)/)("foo1bar2foo3bar");
					fifty.verify(one).length.is(3);
					fifty.verify(one)[0].is("foo1bar2");
					fifty.verify(one)[1].is("1");
					fifty.verify(one)[2].is("2");
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Object: {
			/**
			 * Given a property name and a function that transforms the value of that property, returns a function that transforms
			 * the value of the containing object.
			 */
			property: <T, K extends keyof T>(p: {
				property: K
				change: slime.$api.fp.Transform<T[K]>
			}) => slime.$api.fp.Transform<T>

			/** @deprecated This can be replaced by the stock ECMAScript `Object.entries`. */
			entries: ObjectConstructor["entries"]
			/** @deprecated This can be replaced by the stock ECMAScript `Object.fromEntries`. */
			fromEntries: ObjectConstructor["fromEntries"]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;

			const subject = fifty.global.$api.fp.Object;

			fifty.tests.Object = function() {
				type X = { a: number, b: string };

				run(function properties() {
					var before: X = { a: 2, b: "hey" };
					verify(before).evaluate(subject.property({ property: "a", change: function(n) { return n*2; }})).a.is(4);
					verify(before).evaluate(subject.property({ property: "a", change: function(n) { return n*2; }})).b.is("hey");
				});

				run(function fromEntries() {
					var array = [ ["a", 2], ["b", 3] ];
					var result: { a: number, b: number } = fifty.global.$api.fp.result(
						array,
						Object.fromEntries
					) as { a: number, b: number };
					verify(result).a.is(2);
					verify(result).b.is(3);
					verify(result).evaluate.property("b").is(3);
					verify(result).evaluate.property("c").is(void(0));
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export type Nothing = Readonly<{ present: false }>
	export type Some<T> = Readonly<{ present: true, value: T }>
	export type Maybe<T> = Some<T> | Nothing

	export interface Exports {
		Maybe: {
			from: {
				nothing: () => Nothing

				some: <T>(t: T) => Some<T>

				/**
				 * Converts a possibly-defined JavaScript value to a {@link Maybe}.
				 *
				 * @param t A value
				 *
				 * @returns A {@link Maybe} corresponding to the given value; returns {@link Nothing} if the value is `null` or
				 * `undefined`, or {@link Some | Some<T>} if the value is a `T`.
				 */
				value: <T>(t: T) => Maybe<T>
			}

			present: <T>(m: Maybe<T>) => m is Some<T>

			map: <T,R>(f: (t: T) => R) => (m: Maybe<T>) => Maybe<R>
			else: <T>(f: () => T) => (m: Maybe<T>) => T

			impure: {
				exception: <T,R,E extends Error>(p: { try: (t: T) => slime.$api.fp.Maybe<R>, nothing: (t: T) => E }) => (t: T) => R
			}
		}
	}

	export type Partial<P,R> = (p: P) => Maybe<R>

	export type Match<P,R> = {
		if: Predicate<P>
		then: Mapping<P,R>
	}

	export interface Exports {
		Partial: {
			match: <P,R>(p: Match<P,R>) => Partial<P,R>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			var subject = fifty.global.$api.fp.Partial;

			fifty.tests.exports.Partial = fifty.test.Parent();

			fifty.tests.exports.Partial.match = function() {
				var ifOddThenDouble: Match<number,number> = {
					if: function(n) {
						return n % 2 == 1;
					},
					then: function(n) {
						return n * 2;
					}
				};

				var f = subject.match(ifOddThenDouble);

				run(function odd() {
					var x = f(1);
					verify(x).present.is(true);
					if (x.present) verify(x).value.is(2);
				});

				run(function even() {
					var x = f(2);
					verify(x).present.is(false);
				});
			};
		}
	//@ts-ignore
	)(fifty);


	export interface Exports {
		switch: <P,R>(cases: Partial<P,R>[]) => Partial<P,R>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.switch = function() {
				var arithmetic: slime.$api.fp.Partial<{ operation: string, left: number, right: number }, number> = $api.fp.switch([
					function(p) {
						if (p.operation == "+") {
							return $api.fp.Maybe.from.some(p.left + p.right);
						}
						return $api.fp.Maybe.from.nothing();
					},
					function(p) {
						if (p.operation == "*") {
							return $api.fp.Maybe.from.some(p.left * p.right);
						}
						return $api.fp.Maybe.from.nothing();
					}
				]);

				var add = arithmetic({ operation: "+", left: 2, right: 3 });
				verify(add).present.is(true);
				if (add.present) {
					verify(add).value.is(5);
				}

				var multiple = arithmetic({ operation: "*", left: 2, right: 3 });
				verify(multiple).present.is(true);
				if (multiple.present) {
					verify(multiple).value.is(6);
				}

				var nothing = arithmetic({ operation: "?", left: 2, right: 3 });
				verify(nothing).present.is(false);
			}
		}
	//@ts-ignore
	)(fifty);


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Array = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Array {
			filter: {
				<T,S extends T>(f: (t: T) => t is S): (ts: T[]) => S[]
				<T>(f: fp.Predicate<T>): (ts: T[]) => T[]
			}
			find: <T>(f: fp.Predicate<T>) => (ts: T[]) => T | undefined
			some: <T>(f: fp.Predicate<T>) => (ts: T[]) => boolean
			map: <T,R>(f: (t: T) => R) => (ts: T[]) => R[]
		}
	}

	export namespace exports {
		export interface Array {
			concat: <T>(array: T[]) => (ts: T[]) => T[]
			prepend: <T>(array: T[]) => (ts: T[]) => T[]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				var n24 = [2, 4];

				fifty.tests.exports.Array.concat = function() {
					var append24 = $api.fp.Array.concat(n24);

					var n0124 = append24([0,1]);

					verify(n0124).length.is(4);
					verify(n0124)[0].is(0);
					verify(n0124)[1].is(1);
					verify(n0124)[2].is(2);
					verify(n0124)[3].is(4);
				};

				fifty.tests.exports.Array.prepend = function() {
					var prepend24 = $api.fp.Array.prepend(n24);

					var n2468 = prepend24([6,8]);
					verify(n2468).length.is(4);
					verify(n2468)[0].is(2);
					verify(n2468)[1].is(4);
					verify(n2468)[2].is(6);
					verify(n2468)[3].is(8);
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Array {
			join: (s: string) => (elements: any[]) => string

			groupBy: <V,G>(c: {
				group: (element: V) => G,
				groups?: G[],
				codec?: { encode: (group: G) => string, decode: (string: string) => G },
			}) => (p: V[]) => { group: G, array: V[] }[]

			sum: <T>(attribute: (t: T) => number) => (array: T[]) => number
		}
	}

	export namespace exports {
		export interface Array {
			first: <T>(ordering: Ordering<T>) => (ts: T[]) => Maybe<T>
		}
	}

	export interface Exports {
		Array: exports.Array
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Arrays = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Arrays {
			join: <T>(arrays: T[][]) => T[]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.Arrays.join = function() {
					var arrays = [
						[1,2,3],
						[4],
						[5,6]
					];
					var joined = $api.fp.Arrays.join(arrays);
					verify(joined).length.is(6);
					verify(joined)[0].is(1);
					verify(joined)[1].is(2);
					verify(joined)[2].is(3);
					verify(joined)[3].is(4);
					verify(joined)[4].is(5);
					verify(joined)[5].is(6);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Arrays: exports.Arrays
	}

	export interface Exports {
		Predicate: {
			and: <T>(...predicates: $api.fp.Predicate<T>[]) => $api.fp.Predicate<T>
			or: <T>(...predicates: $api.fp.Predicate<T>[]) => $api.fp.Predicate<T>
			not: <T>(predicate: $api.fp.Predicate<T>) => $api.fp.Predicate<T>
			is: <T>(value: T) => fp.Predicate<T>
			equals: <T>(value: T) => fp.Predicate<T>

			property: <T, K extends keyof T>(k: K, predicate: $api.fp.Predicate<T[K]>) => $api.fp.Predicate<T>
		}
		/** @deprecated Use {@link Exports["Predicate"]} */
		filter: {
			/** @deprecated Use {@link Exports["Predicate"]["and"]}. */
			and: Exports["Predicate"]["and"]
			/** @deprecated Use {@link Exports["Predicate"]["or"]}. */
			or: Exports["Predicate"]["or"]
			/** @deprecated Use {@link Exports["Predicate"]["not"]}. */
			not: Exports["Predicate"]["not"]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const verify = fifty.verify;

			fifty.tests.Predicate = function() {
				fifty.run(function property() {
					type T = { a: number, b: string };

					const ts: T[] = [
						{ a: 1, b: "a" },
						{ a: 2, b: "b" }
					]

					const f1: Predicate<T> = fifty.global.$api.fp.Predicate.property("a", function(v) { return v == 1; });
					const f2: Predicate<T> = fifty.global.$api.fp.Predicate.property("b", function(v) { return v == "b"; });

					verify(ts).evaluate(function(ts) { return ts.filter(f1); }).length.is(1);
					verify(ts.filter(f1))[0].a.is(1);
					verify(ts).evaluate(function(ts) { return ts.filter(f2); }).length.is(1);
					verify(ts.filter(f2))[0].a.is(2);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		JSON: {
			stringify: (p?: {
				replacer?: Parameters<JSON["stringify"]>[1]
				space?: Parameters<JSON["stringify"]>[2]
			}) => (v: any) => string

			prettify: (p: {
				space: Parameters<JSON["stringify"]>[2]
			}) => (json: string) => string
		}
	}

	export interface Exports {
		RegExp: {
			/**
			 * Creates a function that can convert one `RegExp` to another using a function that operates on the `RegExp's`
			 * pattern.
			 *
			 * @param modifier A function that receives the pattern of the original RegExp as an argumentt and returns a new pattern.
			 */
			modify: (modifier: (pattern: string) => string) => (original: RegExp) => RegExp

			exec: (regexp: RegExp) => Partial<string,RegExpExecArray>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const subject = fifty.global.$api.fp.RegExp;

			fifty.tests.exports.RegExp = fifty.test.Parent();

			fifty.tests.exports.RegExp.modify = function() {
				var foo = /^(.*)foo$/;
				var bar = subject.modify(
					function(pattern) { return pattern.replace(/foo/g, "bar"); }
				)(foo);

				var test = function(string) {
					return function(p) {
						return p.test(string);
					}
				};

				var verify = fifty.verify;
				verify(foo).evaluate(test("foo")).is(true);
				verify(foo).evaluate(test("bar")).is(false);
				verify(bar).evaluate(test("foo")).is(false);
				verify(bar).evaluate(test("bar")).is(true);
			};

			fifty.tests.exports.RegExp.exec = function() {
				var pattern = /a(b+)c/;

				var matcher = subject.exec(pattern);

				var one = matcher("abbc");
				verify(one).present.is(true);
				if (one.present) {
					verify(one).value[0].is("abbc");
					verify(one).value[1].is("bb");
				}

				var two = matcher("ac");
				verify(two).present.is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export type CompareFn<T> = (t1: T, t2: T) => number

	export type Ordering<T> = (subject: T) => (other: T) => "BEFORE" | "EQUAL" | "AFTER"

	export interface Exports {
		comparator: {
			/**
			 * Creates a comparator given a mapping (which represents some aspect of an underlying type) and a comparator that
			 * compares the mapped values.
			 */
			create: <T,M>(mapping: (t: T) => M, comparator: fp.CompareFn<M>) => fp.CompareFn<T>

			/**
			 * A comparator that uses the < and > operators to compare its arguments.
			 */
			operators: fp.CompareFn<any>,

			/**
			 * Creates a comparator that represents the opposite of the given comparator.
			 */
			reverse: <T>(comparator: fp.CompareFn<T>) => fp.CompareFn<T>

			/**
			 * Creates a comparator that applies the given comparators in order, using succeeding comparators if a comparator
			 * indicates two values are equal.
			 */
			compose: <T>(...comparators: fp.CompareFn<T>[]) => fp.CompareFn<T>

			from: {
				Ordering: <T>(o: Ordering<T>) => fp.CompareFn<T>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit,
			$api: slime.$api.Global
		) {
			const { verify, run } = fifty;
			const $f = fifty.global.$api.fp;

			fifty.tests.compare = function() {
				run(function orderingArray() {
					var numbers = [1, 0, 2];
					numbers.sort($f.comparator.from.Ordering(function(n) {
						return function(o) {
							var difference = n - o;
							if (difference < 0) return "BEFORE";
							if (difference > 0) return "AFTER";
							return "EQUAL";
						}
					}));
					verify(numbers[0]).is(0);
					verify(numbers[1]).is(1);
					verify(numbers[2]).is(2);
				});

				var array = [
					{ name: "a", value: 1 },
					{ name: "b", value: 0 },
					{ name: "c", value: 2 }
				];
				var comparator: slime.$api.fp.CompareFn<{ name: string, value: number }> = fifty.global.$api.fp.comparator.create(
					fifty.global.$api.fp.property("value"),
					fifty.global.$api.fp.comparator.operators
				);
				array.sort(comparator);
				verify(array)[0].name.is("b");
				verify(array)[1].name.is("a");
				verify(array)[2].name.is("c");
				array.sort(fifty.global.$api.fp.comparator.reverse(comparator));
				verify(array)[0].name.is("c");
				verify(array)[1].name.is("a");
				verify(array)[2].name.is("b");

				var tiebreaking: slime.$api.fp.CompareFn<{ name: string, value: number, tiebreaker: number }> = fifty.global.$api.fp.comparator.create(
					fifty.global.$api.fp.property("tiebreaker"),
					fifty.global.$api.fp.comparator.operators
				);

				var multicomparator: slime.$api.fp.CompareFn<{ name: string, value: number, tiebreaker: number }> = fifty.global.$api.fp.comparator.compose(
					fifty.global.$api.fp.comparator.reverse(comparator),
					fifty.global.$api.fp.comparator.reverse(tiebreaking)
				);

				var multi = [
					{ name: "a", value: 1, tiebreaker: 2 },
					{ name: "b", value: 2, tiebreaker: 0 },
					{ name: "c", value: 1, tiebreaker: 3 },
					{ name: "d", value: 2, tiebreaker: 2 }
				].sort(multicomparator);

				verify(multi)[0].name.is("d");
				verify(multi)[1].name.is("b");
				verify(multi)[2].name.is("c");
				verify(multi)[3].name.is("a");
			}
		}
	//@ts-ignore
	)(fifty, $api, tests, verify);

	export namespace object {
		export type Update<T extends Object> = (t: T) => void

		/**
		 * A function that takes an argument and either (potentially) modifies the argument, returning
		 * `undefined`, or returns a completely new value to replace the argument.
		 */
		export type Revision<M> = (mutable: M) => M | void
	}

	export interface Exports {
		object: {
			/**
			 * Converts a Revision to a function that can be used in a function pipeline; in other words, if it is an revision
			 * that modifies its argument in place, it will be augmented to return the argument. If the argument is `undefined`
			 * or `null`, an identity function will be returned.
			 */
			revise: <M>(f: object.Revision<M>) => (mutable: M) => M

			/**
			 * Creates a `Revision` that runs the given revisions in a pipeline, allowing the `Revision`s to replace the pipeline
			 * input by returning a value.
			 */
			compose: <M>(...functions: object.Revision<M>[]) => (mutable: M) => M

			Update: {
				compose: <M>(functions: object.Update<M>[]) => object.Update<M>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.object = function() {
				var f1 = function(p: { number: number }) {
					p.number += 1;
				};
				var f2 = function(p: { number: number }) {
					p.number *= 2;
				};
				var f3 = function(p: { number: number }) {
					p.number -= 3;
				}
				var f = fifty.global.$api.fp.object.compose(f1, f2, f3);
				var input = { number: 4 };
				var output = f(input);
				verify(output).number.is(7);

				var r1 = function(p: { number: number }): { number: number } {
					return { number: 9 };
				};

				var r = fifty.global.$api.fp.object.compose(f1, r1, f3);
				var rinput = { number: 4 };
				var routput = r(rinput);
				verify(routput).number.is(6);

				fifty.run(function() {
					var nullRevision = fifty.global.$api.fp.object.revise(null);
					var undefinedRevision = fifty.global.$api.fp.object.revise(void(0));

					var two = { number: 2 }

					verify( nullRevision(two) ).is(two);
					verify( undefinedRevision(two) ).is(two);
				});

				fifty.run(function Update() {
					type A = { a: number, b: number, c: number }
					var a: A = { a: 1, b: 2, c: 3 };
					var updates = [
						function(a: A) { a.a++ },
						function(a: A) { a.b++ },
						function(a: A) { a.c = 0 }
					];
					var update = fifty.global.$api.fp.object.Update.compose(updates);
					update(a);
					verify(a).a.is(2);
					verify(a).b.is(3);
					verify(a).c.is(0);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		series: <P extends any[], T>(...functions: ((...args: P) => T)[]) => (...args: P) => T
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.series = function() {
				var api = fifty.global.$api;
				var one = api.fp.series(
					function() {
						return 1;
					},
					function() {
						return 2;
					}
				);
				verify(one()).is(1);
				var two = api.fp.series(
					function(): number {
						return void(0);
					},
					function() {
						return 2;
					}
				);
				verify(two(), "two").is(2);
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace old {
		/**
		 * A function intended to mutate or replace a value.
		 *
		 * A mutator function may modify the value it is given in two ways:
		 *
		 * * It may directly modify the value (if the value is mutable, like an object) in its implementation,
		 * * It may _replace_ the value entirely by returning a value.
		 *
		 * The special value $api.fp.value.UNDEFINED can be returned to replace the value with `undefined`.
		 *
		 * @param p A value to mutate or replace.
		 *
		 * @returns A replacement value, or `undefined` to indicate that the original value (which, if mutable, may have been modified)
		 * should be used.
		 */
		export type Mutator<P> = (p: P) => P
	}

	export interface Exports {
		/** @deprecated */
		argument: {
			/**
			 * Creates an argument-checking function that validates a single function argument.
			 *
			 * @returns A function that examines its arguments and throws a `TypeError` if the specified argument does not meet the
			 * specified criteria.
			 *
			 * @deprecated
			 */
			check: (p: {
				/** The index of the argument to check. */
				index: number
				/** The name of the argument. */
				name: string
				/**
				 * The expected type of the argument, as returned by the JavaScript `typeof` operator. If the argument should be a
				 * string, for example, the value `"string"` should be used.
				 */
				type: string
				/** Whether the value `null` is also an acceptable value for the argument. */
				null: boolean
				/** Whether the value `undefined` is also an acceptable value for the argument. */
				undefined: boolean
			}) => (...args: any[]) => void

			/**
			 * @deprecated
			 */
			isString: (p: {
				index: number
				name: string
				null?: boolean
				undefined?: boolean
			}) => (...args: any[]) => void
		}
		evaluator: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.deprecated = function() {
				var check = fifty.global.$api.fp.argument.check;

				var tester = {
					invoke: function(argument,array) {
						var f = check(argument);
						return f.apply(this,array);
					}
				};

				verify(tester).evaluate(function() { return this.invoke({ index: 0, type: "string" },[1]) }).threw.type(TypeError);
				verify(tester).evaluate(function() { return this.invoke({ index: 0, type: "string" },[void(0)]) }).threw.type(TypeError);
				verify(tester).evaluate(function() { return this.invoke({ index: 0, type: "string" },[null]) }).threw.type(TypeError);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.run(fifty.tests.string);
				fifty.run(fifty.tests.object);
				fifty.run(fifty.tests.compare);
				fifty.run(fifty.tests.is);
				fifty.run(fifty.tests.result);
				fifty.run(fifty.tests.Object);
				fifty.run(fifty.tests.deprecated);
				fifty.run(fifty.tests.series);

				fifty.load("$api-fp-stream.fifty.ts");
				fifty.load("$api-fp-impure.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.$api.fp.internal {
	export interface Context {
		$api: {
			Iterable: any
		}

		old: slime.$api.fp.internal.old.Exports

		events: slime.runtime.internal.events.Exports

		deprecate: slime.$api.Global["deprecate"]

		script: slime.$api.internal.script
	}

	export interface Exports {
		Function: slime.external.lib.typescript.Partial<slime.$api.fp.Exports>
	}

	export type Script = slime.loader.Script<Context,Exports>
}
