//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api {
	export interface Global {
		Function: slime.$api.fp.Exports
	}
}

/**
 * The {@link Exports} member of this namespace is available as `$api.Function` in all scripts loaded by the SLIME loader.
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
		/**
		 * A function that takes a function as an argument and returns a memoized version of that function. Memoized functions
		 * currently cannot be invoked as methods (i.e., with a <code>this</code> value) and also may not receive arguments.
		 *
		 * @param f A function to memoize
		 * @returns A memoized function whose underlying implementation will only be invoked the first time it is invoked;
		 * succeeding invocations will simply return the value returned by the first invocation.
		 */
		memoized: <T>(f: () => T) => () => T
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.exports.memoized = function() {
				var calls: number;

				var counter = function() {
					if (typeof(calls) == "undefined") calls = 0;
					calls++;
					return 42;
				};

				verify(calls).is(void(0));
				var memoized = fifty.global.$api.Function.memoized(counter);
				verify(calls).is(void(0));
				var result = memoized();
				verify(result).is(42);
				verify(calls).is(1);
				var result2 = memoized();
				verify(result2).is(42);
				verify(calls).is(1);
				var result3 = counter();
				verify(result3).is(42);
				verify(calls).is(2);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		pipe: {
			<T,U,V,W,X,Y,Z,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => X,
				j: (x: X) => Y,
				k: (y: Y) => Z,
				l: (z: Z) => R
			): (t?: T) => R
			<T,U,V,W,X,Y,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => X,
				j: (x: X) => Y,
				k: (y: Y) => R
			): (t?: T) => R
			<T,U,V,W,X,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => X,
				j: (x: X) => R
			): (t?: T) => R
			<T,U,V,W,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => R
			): (t?: T) => R
			<T,U,V,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => R
			): (t?: T) => R
			<T,U,R>(
				f: (t: T) => U,
				g: (u: U) => R
			): (t?: T) => R
			<T,R>(f: (t: T) => R): (t?: T) => R
		}
	}

	export interface Exports {
		/**
		 * Returns the result of invoking a function. `result(input, f)` is syntactic sugar for `f(input)` in situations where
		 * writing the input before the function lends clarity (for example, if the function is a pipeline created by `pipe`).
		 */
		result: {
			/** @deprecated Use the two-argument version of `result`, and `pipe` to compose the functions. */
			<P,T,U,V,W,X,Y,Z,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => X,
				k: (x: X) => Y,
				l: (y: Y) => Z,
				m: (z: Z) => R
			): R
			/** @deprecated Use the two-argument version of `result`, and `pipe` to compose the functions. */
			<P,T,U,V,W,X,Y,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => X,
				k: (x: X) => Y,
				l: (y: Y) => R
			): R
			/** @deprecated Use the two-argument version of `result`, and `pipe` to compose the functions. */
			<P,T,U,V,W,X,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => X,
				k: (x: X) => R
			): R
			/** @deprecated Use the two-argument version of `result`, and `pipe` to compose the functions. */
			<P,T,U,V,W,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => R
			): R
			/** @deprecated Use the two-argument version of `result`, and `pipe` to compose the functions. */
			<P,T,U,V,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => R
			): R
			/** @deprecated Use the two-argument version of `result`, and `pipe` to compose the functions. */
			<P,T,U,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => R
			): R
			/** @deprecated Use the two-argument version of `result`, and `pipe` to compose the functions. */
			<P,T,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => R
			): R
			<P,R>(
				p: P,
				f: (i: P) => R
			): R
		}
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

				var x = fifty.global.$api.Function.result(
					2,
					fifty.global.$api.Function.pipe(
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
				var is2 = fifty.global.$api.Function.is(2);

				verify(is2(2)).is(true);
				//@ts-ignore
				verify(is2("2")).is(false);
				verify(is2(3)).is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		returning: <T>(t: T) => () => T

		conditional: {
			<T,R>(p: { condition: (t: T) => boolean, true: (t: T) => R, false: (t: T) => R }): (t: T) => R

			/** @deprecated Replaced by version with condition/true/false. */
			(test: any, yes: any, no: any): any
		}

		Boolean: {
			map: <T>(p: { true: T, false: T }) => (b: boolean) => T
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.string = {};
		}
	//@ts-ignore
	)(fifty);


	export interface Strings {
		split: (delimiter: string) => (string: string) => string[]
		repeat: (count: number) => (string: string) => string
		toUpperCase: (string: string) => string
		match: (pattern: RegExp) => (string: string) => RegExpMatchArray

		startsWith: (searchString: string, startPosition?: number) => Predicate<string>
		endsWith: (searchString: string, endPosition?: number) => Predicate<string>
	}

	export interface Strings {
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
				var replacer = $api.Function.string.replace(/xmas/i, "Christmas");
				var input = "Twas the night before Xmas...";
				var output = "Twas the night before Christmas...";
				verify(replacer(input)).is(output);
			}
		}
	//@ts-ignore
	)(fifty);


	/**
	 * This object is available as `$api.Function` in all scripts loaded by the SLIME loader.
	 */
	export interface Exports {
		string: Strings
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.string = function() {
				var subject = fifty.global.$api.Function.string;

				fifty.run(function repeat() {
					var one = fifty.global.$api.Function.string.repeat(1)("foo");
					fifty.verify(one).is("foo");
					var three = fifty.global.$api.Function.string.repeat(3)("foo");
					fifty.verify(three).is("foofoofoo");
					var zero = fifty.global.$api.Function.string.repeat(0)("foo");
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
		/**
		 * @deprecated All of these methods are just duplicates of ECMAScript standard methods. If we want to have these, perhaps
		 * they should instead return streams.
		 */
		Object: {
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

			fifty.tests.Object = function() {
				run(function fromEntries() {
					var array = [ ["a", 2], ["b", 3] ];
					var result: { a: number, b: number } = fifty.global.$api.Function.result(
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

	export type Nothing = { present: false }
	export type Some<T> = { present: true, value: T }
	export type Maybe<T> = Some<T> | Nothing

	export interface Exports {
		Maybe: {
			nothing: () => Nothing
			value: <T>(t: T) => Some<T>
			from: <T>(t: T) => Maybe<T>
			map: <T,R>(f: (t: T) => R) => (m: Maybe<T>) => Maybe<R>
			else: <T>(f: () => T) => (m: Maybe<T>) => T
			present: <T>(m: Maybe<T>) => m is Some<T>
		}
	}
	export interface Exports {
		Array: {
			filter: {
				<T,S extends T>(f: (t: T) => t is S): (ts: T[]) => S[]
				<T>(f: fp.Predicate<T>): (ts: T[]) => T[]
			}
			find: <T>(f: fp.Predicate<T>) => (ts: T[]) => T | undefined
			map: <T,R>(f: (t: T) => R) => (ts: T[]) => R[]
			join: (s: string) => (elements: any[]) => string

			groupBy: <V,G>(c: {
				group: (element: V) => G,
				groups?: G[],
				codec?: { encode: (group: G) => string, decode: (string: string) => G },
			}) => (p: V[]) => { group: G, array: V[] }[]

			sum: <T>(attribute: (t: T) => number) => (array: T[]) => number
		}
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

					const f1: Predicate<T> = fifty.global.$api.Function.Predicate.property("a", function(v) { return v == 1; });
					const f2: Predicate<T> = fifty.global.$api.Function.Predicate.property("b", function(v) { return v == "b"; });

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

			exec: (regexp: RegExp) => (string: string) => Maybe<RegExpExecArray>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const subject = fifty.global.$api.Function.RegExp;

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

	export type Comparator<T> = (t1: T, t2: T) => number

	export interface Exports {
		comparator: {
			/**
			 * Creates a comparator given a mapping (which represents some aspect of an underlying type) and a comparator that
			 * compares the mapped values.
			 */
			create: <T,M>(mapping: (t: T) => M, comparator: fp.Comparator<M>) => fp.Comparator<T>

			/**
			 * A comparator that uses the < and > operators to compare its arguments.
			 */
			operators: fp.Comparator<any>,

			/**
			 * Creates a comparator that represents the opposite of the given comparator.
			 */
			reverse: <T>(comparator: fp.Comparator<T>) => fp.Comparator<T>

			/**
			 * Creates a comparator that applies the given comparators in order, using succeeding comparators if a comparator
			 * indicates two values are equal.
			 */
			compose: <T>(...comparators: fp.Comparator<T>[]) => fp.Comparator<T>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit,
			$api: slime.$api.Global
		) {
			const { verify } = fifty;

			fifty.tests.compare = function() {
				var array = [
					{ name: "a", value: 1 },
					{ name: "b", value: 0 },
					{ name: "c", value: 2 }
				];
				var comparator: slime.$api.fp.Comparator<{ name: string, value: number }> = fifty.global.$api.Function.comparator.create(
					fifty.global.$api.Function.property("value"),
					fifty.global.$api.Function.comparator.operators
				);
				array.sort(comparator);
				verify(array)[0].name.is("b");
				verify(array)[1].name.is("a");
				verify(array)[2].name.is("c");
				array.sort(fifty.global.$api.Function.comparator.reverse(comparator));
				verify(array)[0].name.is("c");
				verify(array)[1].name.is("a");
				verify(array)[2].name.is("b");

				var tiebreaking: slime.$api.fp.Comparator<{ name: string, value: number, tiebreaker: number }> = fifty.global.$api.Function.comparator.create(
					fifty.global.$api.Function.property("tiebreaker"),
					fifty.global.$api.Function.comparator.operators
				);

				var multicomparator: slime.$api.fp.Comparator<{ name: string, value: number, tiebreaker: number }> = fifty.global.$api.Function.comparator.compose(
					fifty.global.$api.Function.comparator.reverse(comparator),
					fifty.global.$api.Function.comparator.reverse(tiebreaking)
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

	export namespace impure {
		export type Input<T> = () => T
		export type Output<T> = (t: T) => void
		export type Process = () => void
	}

	export interface Exports {
		impure: {
			now: {
				input: <T>(input: impure.Input<T>) => T
				output: <P>(p: P, f: impure.Output<P>) => void
				process: (process: impure.Process) => void
			}

			Process: {
				compose: (processes: impure.Process[]) => impure.Process
				output: <P>(p: P, f: impure.Output<P>) => impure.Process
			}
		}
	}

	export namespace world {
		export type Question<P,E,A> = (p?: P) => Ask<E,A>
		export type Action<P,E> = (p?: P) => Tell<E>

		export type Ask<E,T> = (events: slime.$api.Events<E>) => T
		export type Tell<E> = (events: slime.$api.Events<E>) => void

		/** @deprecated */
		export namespace old {
			/** @deprecated */
			export type Ask<E,T> = (on?: slime.$api.events.Handler<E>) => T

			/** @deprecated */
			export type Tell<E> = (on?: slime.$api.events.Handler<E>) => void

			/** @deprecated */
			export type Action<P,E> = (p?: P) => Tell<E>

			/** @deprecated Identical to {@link Ask} but has slightly different semantics (analogous to HTTP POST). */
			export type Operation<E,R> = (on?: slime.$api.events.Handler<E>) => R
		}
	}

	export interface World {
		question: <P,E,A>(question: world.Question<P,E,A>, handler?: slime.$api.events.Handler<E>) => (p: P) => A
		action: <P,E>(action: world.Action<P,E>, handler?: slime.$api.events.Handler<E>) => impure.Output<P>

		ask: <E,A>(ask: world.Ask<E,A>, handler?: slime.$api.events.Handler<E>) => impure.Input<A>
		tell: <E>(tell: world.Tell<E>, handler?: slime.$api.events.Handler<E>) => impure.Process

		now: {
			question: <P,E,A>(question: world.Question<P,E,A>, argument?: P, handler?: slime.$api.events.Handler<E>) => A
			action: <P,E>(action: world.Action<P,E>, argument?: P, handler?: slime.$api.events.Handler<E>) => void
		}

		/** @deprecated Used almost entirely for `jsh.shwll.tools.node.require`. After refactoring that, reassess. */
		execute: <E>(tell: world.Tell<E>, handler?: slime.$api.events.Handler<E>) => void

		/** @deprecated */
		old: {
			/** @deprecated */
			ask: <E,T>(f: (events: slime.$api.Events<E>) => T) => world.old.Ask<E,T>
			/** @deprecated */
			tell: <E>(f: (events: slime.$api.Events<E>) => void) => world.old.Tell<E>
		}
	}

	export interface Exports {
		world: World
	}

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

			fifty.tests.impure = function() {
				var f1 = function(p: { number: number }) {
					p.number += 1;
				};
				var f2 = function(p: { number: number }) {
					p.number *= 2;
				};
				var f3 = function(p: { number: number }) {
					p.number -= 3;
				}
				var f = fifty.global.$api.Function.object.compose(f1, f2, f3);
				var input = { number: 4 };
				var output = f(input);
				verify(output).number.is(7);

				var r1 = function(p: { number: number }): { number: number } {
					return { number: 9 };
				};

				var r = fifty.global.$api.Function.object.compose(f1, r1, f3);
				var rinput = { number: 4 };
				var routput = r(rinput);
				verify(routput).number.is(6);

				fifty.run(function() {
					var nullRevision = fifty.global.$api.Function.object.revise(null);
					var undefinedRevision = fifty.global.$api.Function.object.revise(void(0));

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
					var update = fifty.global.$api.Function.object.Update.compose(updates);
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
				var one = api.Function.series(
					function() {
						return 1;
					},
					function() {
						return 2;
					}
				);
				verify(one()).is(1);
				var two = api.Function.series(
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
		 * The special value $api.Function.value.UNDEFINED can be returned to replace the value with `undefined`.
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

		/**
		 * @deprecated
		 */
		mutating: {
			/**
			 * @deprecated
			 *
			 * Creates a function that wraps a supplied mutator function for the purpose of modifying a default value.
			 * `mutating()` is designed for use by API designers who wish to provide an override mechanism for a particular
			 * default value (especially an object). API designers may provide for a single value to be supplied which can be an
			 * object to replace the default, a function which returns a value to replace the default, or a value that mutates
			 * the default.
			 */
			<T>(f: old.Mutator<T>): (t?: T) => T

			/**
			 * @deprecated
			 *
			 * Creates a function that returns the given value, regardless of what it is passed.
			 *
			 * @param t The value to always return.
			 */
			<T>(t: T): (t: T) => T

			/**
			 * @deprecated
			 *
			 * Creates a function that will simply return its argument.
			 */
			<T>(f: undefined): (t: T) => T
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.deprecated = function() {
				var check = fifty.global.$api.Function.argument.check;

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
				fifty.run(fifty.tests.impure);
				fifty.run(fifty.tests.compare);
				fifty.run(fifty.tests.is);
				fifty.run(fifty.tests.result);
				fifty.run(fifty.tests.Object);
				fifty.run(fifty.tests.deprecated);
				fifty.run(fifty.tests.series);

				fifty.load("$api-Function-stream.fifty.ts");
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

		old: {
			Function: Partial<slime.$api.fp.Exports>
		}

		events: slime.runtime.internal.events.Exports

		deprecate: slime.$api.Global["deprecate"]

		script: slime.$api.internal.script
	}

	export interface Exports {
		Function: Partial<slime.$api.fp.Exports>
	}

	export type Script = slime.loader.Script<Context,Exports>
}
