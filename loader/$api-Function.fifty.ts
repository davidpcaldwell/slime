//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * APIs for functional programming.
 *
 * The {@link slime.$api.fp.Exports | Exports} member of this namespace is available as `$api.fp` in all scripts loaded by the
 * SLIME loader.
 */
namespace slime.$api.fp {
	/**
	 * The SLIME functional programming APIs. This object is available as `$api.fp` in all scripts loaded by the SLIME loader.
	 *
	 * The APIs strongly favor functions with a single argument, given that JavaScript has multiple ways
	 * to pass multiple values through a single argument (for example arguments can be objects with multiple properties, or arrays with
	 * multiple elements).
	 *
	 * The {@link slime.$api.fp.methods | methods} namespace provides the ability to convert functional implementations into a more
	 * object-oriented style, by pinning arguments in chains of single-argument functions.
	 */
	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * The identity function, which returns the argument it was passed.
		 */
		identity: <T>(t: T) => T
	}

	/**
	 * A function that, given a single argument, returns a single result.
	 */
	export type Mapping<P,R> = (p: P) => R

	/**
	 * A function that, given a single argument, returns a single result of the same type as that argument.
	 */
	export type Transform<T> = Mapping<T,T>

	/**
	 * A type definition that can be attached to the `$api.fp.identity` function to create a function that acts as a type hint
	 * for pipelining.
	 */
	export type Identity<T> = Mapping<T,T>

	export type Predicate<T> = (t: T) => boolean

	/**
	 * A special kind of `Predicate` where all values that satisfy the predicate are known to be members of a subtype of the
	 * predicate type.
	 */
	export type TypePredicate<T,N extends T> = (t: T) => t is N

	export interface Exports {
		cast: {
			/**
			 * A function that can be declared as type {@link slime.js.Cast | `slime.js.Cast<T>`} and cast any value to `T`. The
			 * cast is simply asserted, so it is the caller's responsibility to know the cast is valid.
			 */
			unsafe: <T>(t: any) => T

			/**
			 * Performs a cast that relies on the given `TypePredicate` to determine whether the value can really be cast to the
			 * desired subtype. If the TypePredicate does not accept the value, an error is thrown.
			 */
			guarded: <T,N extends T>(predicate: TypePredicate<T,N>) => (t: T) => N

			/**
			 * Tries to perform a cast, using the given `TypePredicate` to determine whether the given value is of the desired
			 * subtype. If it is, it will be returned; otherwise, `Maybe.from.nothing` will be returned.
			 */
			maybe: <T,N extends T>(predicate: TypePredicate<T,N>) => (t: T) => Maybe<N>
		}

		//	TODO	is this even an fp construct?
		/**
		 * Returns a JavaScript type for the given value. This value is identical to the result of the JavaScript `typeof` operator
		 * unless the given value is `null`, in which case it is `"null"`.
		 */
		type: (v: any) => string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.cast = function() {
				var a: any = { a: 1 };

				interface A {
					a: number
				}

				var cast: slime.js.Cast<A> = $api.fp.cast.unsafe;

				var narrowed = cast(a);
				verify(narrowed).a.is(1);

				interface B extends A {
					b: number
				}

				var b = { a: 2, b: 4 } as A;

				var isB: TypePredicate<A,B> = function(a: A): a is B { return typeof a["b"] != "undefined" };

				var toB = $api.fp.cast.guarded(isB);

				verify(narrowed).evaluate(toB).threw.type(Error);
				verify(b).evaluate(toB).is(b as B);

				var tryB = $api.fp.cast.maybe(isB);

				verify(narrowed).evaluate(tryB).present.is(false);
				verify(b).evaluate(tryB).present.is(true);
				var tried = tryB(b);
				if (tried.present) {
					verify(tried).value.is(b as B);
				}

			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * APIs related to {@link Mapping}s.
		 */
		Mapping: mapping.Exports

		/**
		 * @deprecated Replaced by `impure.External.value`/`Thunk.value` and `Mapping.from.all`
		 * @param t
		 * @returns
		 */
		returning: <T>(t: T) => () => T

		/**
		 * @deprecated Replaced by `Mapping.from.value`.
		 */
		mapAllTo: <P,R>(r: R) => (p: P) => R


		/** @deprecated Replaced by `Mapping.properties`. */
		split: <P,R>(functions: { [k in keyof R]: (p: P) => R[k] }) => (p: P) => R
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Thunk = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type Thunk<T> = () => T

	export interface Exports {
		Thunk: {
			memoize: <T>(f: Thunk<T>) => Thunk<T>
			map: Thunk_map
			value: Thunk_value
			now: Thunk_now
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.Thunk.memoize = function() {
				const one = fifty.spy.create($api.fp.Thunk.value(1));
				const memoized = fifty.spy.create($api.fp.Thunk.memoize(one.function));

				var x = memoized.function();
				var y = memoized.function();

				verify(one).invocations.length.is(1);
				verify(memoized).invocations.length.is(2);
			}

			fifty.tests.exports.Thunk.now = function() {
				const one: Thunk<number> = $api.fp.Thunk.value(1);

				const double = function(n: number): number { return n*2; };

				var a = $api.fp.Thunk.now(one, double);
				verify(a).is(2);

				var b = $api.fp.Thunk.now(one, double, double);
				verify(b).is(4);
			};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Predicate: {
			and: {
				<A,B extends A>(predicates: [TypePredicate<A,B>, Predicate<B>]): TypePredicate<A,B>
				<T>(...predicates: $api.fp.Predicate<T>[]): $api.fp.Predicate<T>
			}
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
			const { $api } = fifty.global;

			fifty.tests.Predicate = function() {
				fifty.run(function and() {
					interface A {
						a: number
					};

					interface B extends A {
						b: number
					}

					var isB = (a: A): a is B => {
						return typeof(a["b"]) != "undefined";
					}

					var list: A[] = [
						{ a: 1 },
						{ a: 2, b: 2 } as A,
						{ a: 3 },
						{ a: 4, b: 4} as A,
						{ a: 5, b: 0 } as A
					];

					var bOver3 = $api.fp.Predicate.and([ isB, (b) => b.b > 3 ]);

					var bsOver3 = list.filter(bOver3);
					verify(bsOver3).length.is(1);
					verify(bsOver3)[0].a.is(4);
					verify(bsOver3)[0].b.is(4);
				});

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
		/**
		 * @deprecated Use `Predicate.is`.
		 */
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
		/**
		 * Converts a function that takes an argument with a set of properties to a function that takes an argument with fewer
		 * properties, by fixing some of the properties in advance.
		 */
		curry: <T,P extends { [K in keyof T]?: T[K] },R>(fix: P) => (f: (t: T) => R) => (t: Omit<T, keyof P>) => R
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.curry = function() {
				var f: (p: { a: number, b: string, c: boolean }) => string = function(p) { return [p.a,p.b,p.c].join("/") };
				var g = $api.fp.curry({ a: 2, b: "hey" })(f);
				verify( g({ c: true }) ).is("2/hey/true");
			};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Flattens a function that takes an object with a single property into a function that takes a value (for that property).
		 *
		 * This can be used in a situation where a function takes an object with many properties, but all the others are optional,
		 * or perhaps on a function created with `curry`, where all the other properties required by the function have already
		 * been fixed.
		 */
		flatten: <T,R,K extends keyof T>(k: K) => (f: (t: T) => R) => (v: T[K]) => R
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.flatten = function() {
				const divide = function(p: { dividend: number, divisor: number }): number {
					return p.dividend / p.divisor;
				};

				const halve = $api.fp.now(divide, $api.fp.curry({ divisor: 2 }), $api.fp.flatten("dividend"));

				verify(halve(2)).is(1);
			}

			fifty.tests.wip = fifty.tests.exports.flatten;
		}
	//@ts-ignore
	)(fifty);

	//	TODO	Now that we have curry and flatten to process functions, maybe we need $api.fp.create,
	//			analogous to $api.fp.now, with first argument as function, or maybe all arguments as functions?

	export interface Exports {
		pipe: Pipe
	}

	export interface Exports {
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
			trim: Transform<string>

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

		export interface String {
			format: <T>(p: {
				mask: string
				values: ((t: T) => string)[]
			}) => (t: T) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.string.format = function() {
					var name = { first: "David", middle: "Paul", last: "Caldwell" };
					var asName: slime.$api.fp.Identity<typeof name> = $api.fp.identity;
					var mi = $api.fp.pipe(asName, $api.fp.property("middle"), function(s) { return s.substring(0,1) });
					var formatter: (t: typeof name) => string = $api.fp.string.format({
						mask: "(), () ().",
						values: [
							$api.fp.pipe($api.fp.property("last"), $api.fp.string.toUpperCase),
							$api.fp.property("first"),
							mi
						]
					});
					var formatted = formatter(name);
					verify(formatted).is("CALDWELL, David P.");
				}
			}
		//@ts-ignore
		)(fifty);

	}

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

	export type Data = { [x: string]: Data } | string | number | boolean | null | Data[]

	export interface Exports {
		Object: {
			/**
			 * Given a property name and a function that transforms the value of that property, returns a function that transforms
			 * the value of the containing object.
			 */
			property: {
				update: <T, K extends keyof T>(p: {
					property: K
					change: slime.$api.fp.Transform<T[K]>
				}) => slime.$api.fp.Transform<T>

				set: <T, K extends string, V>(p: { [k in K]: slime.$api.fp.Mapping<T,V> }) => (t: T) => (T & { [k in K]: V })

				maybe: {
					<T,K extends keyof T>(k: K): (t: T) => slime.$api.fp.Maybe<T[K]>
					<T,K extends keyof T,KK extends keyof T[K]>(k: K,kk: KK): (t: T) => slime.$api.fp.Maybe<T[K][KK]>
				}
			}

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
			const { $api } = fifty.global;

			const subject = fifty.global.$api.fp.Object;

			fifty.tests.Object = function() {
				type X = { a: number, b: string };
				type Y = { a: number, b: string, foo: () => number };

				run(function property_set() {
					var before: X = { a: 1, b: "b" };
					//	TODO	for some reason type inference doesn't work for this case
					var after = $api.fp.now.map(
						before,
						subject.property.set({
							c: function(t) {
								return true;
							}
						})
					);

					verify(after).a.is(1);
					verify(after).b.is("b");
					verify(after).c.is(true);
				});

				run(function property_update() {
					var before: X = { a: 2, b: "hey" };
					verify(before).evaluate(subject.property.update({ property: "a", change: function(n) { return n*2; }})).a.is(4);
					verify(before).evaluate(subject.property.update({ property: "a", change: function(n) { return n*2; }})).b.is("hey");
					var disallowed: Y = { a: 2, b: "hey", foo: function() { return 3; }};
					// verify(disallowed).evaluate(subject.property.update({ property: "a", change: function(n) { return n*2; }})).a.is(4);
					// verify(disallowed).evaluate(subject.property.update({ property: "a", change: function(n) { return n*2; }})).b.is("hey");
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

				run(function property_maybe() {
					type T = { a?: { b?: number } };
					var o: T[] = [
						{},
						{ a: {} },
						{ a: { b: 0 } }
					];

					var cases = o.map(function(t) {
						return {
							a: $api.fp.now.map(t, subject.property.maybe("a")),
							b1: $api.fp.now.map(t, subject.property.maybe("a"), $api.fp.Maybe.map(subject.property.maybe("b")),
								function flatten(m) {
									if (!m.present) return $api.fp.Maybe.from.nothing();
									return m.value;
								}
							),
							b2: $api.fp.now.map(t, subject.property.maybe("a", "b"))
						}
					});
					verify(cases)[0].a.present.is(false);
					verify(cases)[0].b1.present.is(false);
					verify(cases)[0].b2.present.is(false);
					verify(cases)[1].a.present.is(true);
					verify(cases)[1].b1.present.is(false);
					verify(cases)[1].b2.present.is(false);
					verify(cases)[2].a.present.is(true);
					verify(cases)[2].b1.present.is(true);
					verify(cases)[2].b2.present.is(true);
					var two = {
						b1: cases[2].b1,
						b2: cases[2].b2
					};
					if (two.b1.present) {
						verify(two.b1).value.is(0);
					}
					if (two.b2.present) {
						verify(two.b2).value.is(0);
					}
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

			pipe: {
				<A,B,C>(
					f: (a: A) => Maybe<B>,
					g: (b: B) => Maybe<C>
				): (a: A) => Maybe<C>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.Maybe = fifty.test.Parent();

			fifty.tests.exports.Maybe.pipe = function() {
				var halveEvenly = function(n: number): Maybe<number> {
					if (n%2 == 0) return $api.fp.Maybe.from.some(n/2);
					return $api.fp.Maybe.from.nothing();
				};

				var quarterEvenly = $api.fp.Maybe.pipe(halveEvenly, halveEvenly);

				var halve2 = halveEvenly(2);
				verify(halve2).present.is(true);
				if (halve2.present) verify(halve2).value.is(1);
				verify(halveEvenly(1)).present.is(false);

				var quarter4 = quarterEvenly(4);
				verify(quarter4).present.is(true);
				if (quarter4.present) verify(quarter4).value.is(1);
				verify(quarterEvenly(2)).present.is(false);
				verify(quarterEvenly(1)).present.is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Partial<P,R> = (p: P) => Maybe<R>

	export namespace partial {
		export interface Exports {
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Partial = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Partial: partial.Exports
	}

	export namespace partial {
		export interface Exports {
			from: {
				/**
				 * Creates a partial function from a "loose" function, where "loose" is defined as a JavaScript function that might
				 * return `null` or the undefined value. The resulting partial function will return `Maybe.from.nothing` if the
				 * loose function returns `null` or the undefined value, and `Maybe.from.some(v)` if the loose function returns the
				 * value `v`.
				 *
				 * This allows partial functions to be defined with less-verbose JavaScript syntax; return ordinary values (rather
				 * than `Maybe`s) for input for which they are defined, and simply not return values for input for which they are
				 * not defined.
				 *
				 * @param f A JavaScript function.
				 * @returns A partial function implemented in terms of the given JavaScript function.
				 */
				loose: <P,R>(f: slime.$api.fp.Mapping<P,R>) => Partial<P,R>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.Partial.from = function() {
					var partial = $api.fp.Partial.from.loose(function(x: number): number {
						if (x % 2 === 0) return x / 2;
					});

					var two = partial(2);
					verify(two).present.is(true);
					if (two.present) verify(two.value).is(1);

					var one = partial(1);
					verify(one).present.is(false);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export type Match<P,R> = {
		if: Predicate<P>
		then: Mapping<P,R>
	}

	export type TypeMatch<P,N extends P,R> = {
		if: TypePredicate<P,N>
		then: Mapping<N,R>
	}

	export namespace partial {
		export interface Exports {
			match: {
				<P,N extends P,R>(p: TypeMatch<P,N,R>): fp.Partial<P,R>
				<P,R>(p: Match<P,R>): fp.Partial<P,R>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				var subject = fifty.global.$api.fp.Partial;

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
	}

	export namespace partial {
		export interface Exports {
			else: <P,R>(p: fp.Mapping<P,R>) => fp.Mapping<fp.Partial<P,R>,fp.Mapping<P,R>>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				var subject = fifty.global.$api.fp.Partial;

				fifty.tests.exports.Partial.else = function() {
					var ifOddThenDouble: Match<number,number> = {
						if: function(n) {
							return n % 2 == 1;
						},
						then: function(n) {
							return n * 2;
						}
					};

					var partial = subject.match(ifOddThenDouble);

					var total = $api.fp.now(
						partial,
						$api.fp.Partial.else(function(n) { return n * 3 })
					);

					verify(1).evaluate(total).is(2);
					verify(2).evaluate(total).is(6);
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace partial {
		export interface Exports {
			impure: {
				old: {
					/**
					 * Converts a partial function into a total function that throws an exception if the partial function returns
					 * `Maybe.nothing`; essentially the resulting function asserts the the partial function will return a value.
					 * @param p
					 * @returns
					 */
					exception: <P,R,E extends Error>(p: {
						try: fp.Partial<P,R>
						nothing: (p: P) => E
					}) => fp.Mapping<P,R>
				}

				exception: <P,R,E extends Error>(nothing: (p: P) => E) => (partial: fp.Partial<P,R>) => fp.Mapping<P,R>
			}
		}
	}

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
		Stream: stream.Exports
	}

	/**
	 * A function with the semantics of the standard JavaScript `sort` function argument.
	 *
	 * See the specification for [Array.prototype.sort](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.sort)
	 */
	export type CompareFn<T> = (t1: T, t2: T) => number

	/**
	 * A comparison order that can be expressed as a partial function. The partial function should
	 * return a {@link Maybe} with value `true` if its arguments are in the correct order and `false` if
	 * they are not, and should return `$api.fp.Maybe.from.nothing()` if it cannot determine the correct order.
	 */
	export type Ordering<T> = Partial<[T,T],boolean>

	export interface Exports {
		Ordering: {
			from: {
				operators: Ordering<any>

				prioritize: <T>(p: {
					predicate: slime.$api.fp.Predicate<T>
					value: boolean
				}) => Ordering<T>

				map: <T,V>(p: {
					map: slime.$api.fp.Mapping<T,V>
					ordering: Ordering<V>
				}) => Ordering<T>
			}

			array: {
				first: <T>(ordering: Ordering<T>) => (t: T[]) => slime.$api.fp.Maybe<T>

				sort: <T>(ordering: Ordering<T>) => (t: T[]) => T[]
			}
		}
	}


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.Ordering = fifty.test.Parent();

			fifty.tests.exports.Ordering.from = fifty.test.Parent();

			fifty.tests.exports.Ordering.from.operators = function() {
				var array = [1, 0, 2];
				verify(array)[0].is(1);
				verify(array)[1].is(0);
				verify(array)[2].is(2);
				array = $api.fp.Ordering.array.sort($api.fp.Ordering.from.operators)(array);
				verify(array)[0].is(0);
				verify(array)[1].is(1);
				verify(array)[2].is(2);
			};

			fifty.tests.exports.Ordering.from.prioritize = function() {
				var array = [3, 1, 2, 4];
				var prioritized = $api.fp.switch([
					$api.fp.Ordering.from.prioritize({
						predicate: function(n: number) { return n % 2 == 0; },
						value: true
					}),
					$api.fp.Ordering.from.operators
				]);
				verify(array)[0].is(3);
				verify(array)[1].is(1);
				verify(array)[2].is(2);
				verify(array)[3].is(4);
				array = $api.fp.Ordering.array.sort(prioritized)(array);
				verify(array)[0].is(2);
				verify(array)[1].is(4);
				verify(array)[2].is(1);
				verify(array)[3].is(3);
			};

			fifty.tests.exports.Ordering.from.map = function() {
				var array = [3, 1, 2, 4];
				var byMod3 = $api.fp.switch([
					$api.fp.Ordering.from.map({
						map: function(n: number) { return n % 3; },
						ordering: $api.fp.Ordering.from.operators
					}),
					$api.fp.Ordering.from.operators
				]);
				verify(array)[0].is(3);
				verify(array)[1].is(1);
				verify(array)[2].is(2);
				verify(array)[3].is(4);
				array = $api.fp.Ordering.array.sort(byMod3)(array);
				verify(array)[0].is(3);
				verify(array)[1].is(1);
				verify(array)[2].is(4);
				verify(array)[3].is(2);
			};

			fifty.tests.exports.Ordering.first = function() {
				var order = (array: [number,number]) => (array[0] != array[1]) ? $api.fp.Maybe.from.some(array[0] < array[1]) : $api.fp.Maybe.from.nothing();
				var ns: number[] = [1, 0, 2];
				var first = $api.fp.Ordering.array.first(order);

				fifty.run(function() {
					var value = first(ns);
					verify(value).present.is(true);
					if (value.present) {
						verify(value).value.is(0);
					}
				});

				fifty.run(function() {
					var value = first([]);
					verify(value).present.is(false);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Operations pertaining to {@link CompareFn}s, which can be used with the standard JavaScript `Array.prototype.sort`
		 * method.
		 */
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
				/**
				 * Creates a standard JavaScript {@link CompareFn} from an {@link Ordering}; this function can be used as an
				 * argument to `Array.prototype.sort`.
				 *
				 * To simply sort an array, `Ordering.array.sort` can be used, which will duplicate the array and return the
				 * sorted version.
				 */
				Ordering: <T>(ordering: Ordering<T>) => fp.CompareFn<T>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			const { $api } = fifty.global;

			const $f = fifty.global.$api.fp;

			fifty.tests.compare = function() {
				run(function beforeArray() {
					var numbers = [1, 0, 2];
					numbers.sort($f.comparator.from.Ordering(function(array) {
						var difference = array[0] - array[1];
						if (difference != 0) return $api.fp.Maybe.from.some(difference < 0);
						return $api.fp.Maybe.from.nothing();
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
	)(fifty);

	export namespace json {
		export type Parser<T> = (json: string) => T
	}

	export interface Exports {
		JSON: {
			stringify: (p?: {
				replacer?: Parameters<slime.external.lib.es5.JSON["stringify"]>[1]
				space?: Parameters<slime.external.lib.es5.JSON["stringify"]>[2]
			}) => (v: any) => string

			prettify: (p: {
				space: Parameters<slime.external.lib.es5.JSON["stringify"]>[2]
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
					return function(p): boolean {
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

	export interface Exports {
		/**
		 * Returns the result of invoking a function on an argument. `now(p, f)` is syntactic sugar for `f(p)`, and
		 * `now(p, f, g) is syntactic sugar for `g(f(p))`.
		 */
		now: Now_map & {
			/**
			 * @deprecated Replaced by {@link Exports.now}.
			 */
			invoke: Now_map

			/**
			 * @deprecated Replaced by {@link Exports.now}.
			 */
			map: Now_map
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

				var result = $api.fp.now.map(2, f);
				verify(result).is("2");

				var result2 = $api.fp.now.map(2, f, g);
				verify(result2).is("g2");
			};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * @deprecated Use {@link Exports.now | `$api.fp.now.map`}.
		 */
		result: Now_map
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
	}

	export namespace evaluator {
		export interface Invocation {
			target: object
			arguments: any[]
		}

		export interface Cache {
			get: (invocation: Invocation) => any
			set: (invocation: Invocation, value: any) => void
		}
	}

	export interface Exports {
		/**
		 * Creates a function which invokes a series of operations, in order, and returns the first non-`undefined` value returned
		 * by one of them.
		 *
		 * @param args Upon invocation, each argument is used, in order, until one of them produces
		 * a value other than `undefined`.
		 *
		 * *  If it is a `function`, the function is invoked with the same arguments (and `this`), and the return value is used.
		 *
		 * *  If it is a {@link evaluator.Cache | Cache}, the `get` method of the cache is invoked with an {@link evaluator.Invocation} representing the invocation of the function, and the return value of `get` is used.
		 *
		 * Once an operation produces a value other than `undefined`, that value will be used as the return value of the function.
		 *
		 * Before returning that value:
		 *
		 *
		 * *  If the operation that produced the value is a {@link evaluator.Cache | Cache}, its `set` method is invoked with the {@link evaluator.Invocation} and the value.
		 *
		 * *  Any caches *preceding* the operation that produced the value will have their `set` methods invoked with the {@link evaluator.Invocation} and the value.
		 *
		 * @returns A function that implements the algorithm described above.
		 */
		evaluator: <T,P extends any[],R>(...args: (slime.external.lib.es5.Function<T,P,R> | evaluator.Cache)[] ) => slime.external.lib.es5.Function<T,P,R>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			const test = function(b: boolean) {
				verify(b).is(true);
			};

			fifty.tests.exports.evaluator = function() {
				var one = Object.assign(
					function(n) {
						one.calls++;
						return n*2;
					},
					{
						calls: 0
					}
				);
				one.calls = 0;
				var two = new function() {
					var values = {};

					this.get = function(p) {
						return values[p.arguments[0]];
					};

					this.set = function(p,v) {
						values[p.arguments[0]] = v;
					};

					this.test = {};
					this.test.get = function(v) {
						return values[v];
					};
				};
				var evaluator = $api.fp.evaluator(two,one);

				test(one.calls == 0);
				test(typeof(two.test.get(2)) == "undefined");

				test(evaluator(2) == 4);

				test(one.calls == 1);
				test(two.test.get(2) == 4);

				test(evaluator(2) == 4);
				test(one.calls == 1);
				test(two.test.get(2) == 4);

				test(evaluator(3) == 6);
				test(one.calls == 2);
				test(two.test.get(3) == 6);
				//	TODO	write tests for top-level also being a cache: in other words, a convenience cache that receives
				//			a callback to store each time it calculates a value
			}
		}
	//@ts-ignore
	)(fifty);

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
				//	TODO	clean up tests; many should be under this test and are not
				fifty.run(fifty.tests.exports);
				fifty.run(fifty.tests.string);
				fifty.run(fifty.tests.object);
				fifty.run(fifty.tests.compare);
				fifty.run(fifty.tests.is);
				fifty.run(fifty.tests.result);
				fifty.run(fifty.tests.Object);
				fifty.run(fifty.tests.deprecated);
				fifty.run(fifty.tests.series);

				fifty.load("$api-fp-Mapping.fifty.ts");
				fifty.load("$api-fp-stream.fifty.ts");
				fifty.load("$api-fp-impure.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.$api.fp.internal {
	export interface Context {
		$api: Pick<slime.$api.Global,"Iterable">

		old: slime.$api.fp.internal.old.Exports

		events: slime.runtime.internal.events.Exports

		deprecate: slime.$api.Global["deprecate"]

		script: slime.$api.internal.script
	}

	export type Exports = Omit<slime.$api.fp.Exports,"methods">

	export type Script = slime.loader.Script<Context,Exports>
}
