//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.definition.verify {
	/**
	 * Allows evaluating an arbitrary function with this subject's underlying value as an argument, and returning its result as a new
	 * {@link Subject}.
	 *
	 * The new subject also has the ability to test for errors thrown during the operation. One can test for:
	 * * `.threw`, which returns the thrown object (probably an `Error`), as the subject, allowing it to be asserted upon.
	 * * `.threw.type(type)`, which asserts that a subtype of `type` was thrown
	 * * `.threw.nothing()`, which asserts that nothing was thrown.
	 */
	type evaluate<T> = {
		<R>(f: (t: T) => R): Subject<R> & {
			threw: Subject<Error> & {
				type: <E extends ErrorConstructor>(type: E) => void
				nothing: () => void
			}
		}
		property: any
	}

	type is<T> = {
		/**
		 * Asserts that the subject value is === to the given value.
		 */
		(t: T): void
		type: (name: string) => void
		not: {
			(t: T): void
			equalTo: any
		}
	}

	type AssertSubject<T> = {
		is: is<T>
		evaluate: evaluate<T>
	}

	type TargetSubject<T> = {
		[K in keyof T]: Subject<T[K]>
	}

	type MethodSubject<T extends (...args: any) => any> = AssertSubject<T> & {
		//	TODO	could we build the .threw stuff into MethodSubject as well?
		(...p: Parameters<T>): Subject<ReturnType<T>>
	}

	type Subject<T> = (
		TargetSubject<T>
		& (
			T extends Boolean
			? AssertSubject<boolean>
			: (
				T extends (...args: any) => any
				? MethodSubject<T>
				: T extends Array<any>
					? AssertSubject<T> & { length: Subject<number> }
					: AssertSubject<T>
			)
		)
	)

	/**
	 * A function that returns a {@link Subject}, which supports a convenient API for making assertions about a subject value.
	 * Practical examples can be found in the [`slime.definnition.verify` tests](../src/loader/api/verify.fifty.ts?as=text).
	 */
	export type Verify = {
		<T>(value: boolean, name?: string, lambda?: (it: AssertSubject<boolean>) => void): AssertSubject<boolean>
		<T>(value: T, name?: string, lambda?: (it: Subject<T>) => void): Subject<T>
	}

	/**
	 * An object that can execute {@link Context.Test}s.
	 */
	export type Context = (f: slime.definition.unit.Test) => void

	/**
	 * Creates a {@link Verify} object that communicates with the given {@link Context}.
	 */
	export type Export = ( scope: Context ) => Verify

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.primitivesCanHaveEvaluateCalled = function() {
				fifty.verify(2,"2").evaluate(function(p) { return p * 2; }).is(4);
			}

			fifty.tests.objectCanHaveEvaluateCalled = function() {
				var object = {
					method: Object.assign(function() {
					}, { foo: "bar" })
				};

				fifty.verify(object,"object").evaluate(function(p) {
					return 0;
				}).is(0);
			}

			fifty.tests.functionsCanHaveEvaluateCalled = function() {
				var object = {
					method: Object.assign(function() {
					}, { foo: "bar" })
				};

				//	TODO	See https://github.com/davidpcaldwell/slime/issues/48
				fifty.verify(object,"object").method.evaluate(function(p) {
					return p.foo == "bar";
				}).is(true);
			}

			fifty.tests.methodsWork = function() {
				var target = {
					method: function() {
						return 2;
					}
				};

				fifty.verify(target,"target").method().is(2);
			}

			fifty.tests.evaluateHasThrew = function() {
				var object = {
					method: function() {
						return 2;
					}
				};

				fifty.verify(object).evaluate(function(o) { return o.method(); }).threw.nothing();
			}

			fifty.tests.suite = function() {
				var object = {
					method: Object.assign(function() {
					}, { foo: "bar" })
				};

				fifty.verify(1).is(1);

				var method = fifty.verify(object,"object").method;
				method.is.type("function");

				fifty.tests.primitivesCanHaveEvaluateCalled();
				fifty.tests.objectCanHaveEvaluateCalled();
				fifty.tests.functionsCanHaveEvaluateCalled();
				fifty.verify(object,"object").method.foo.is("bar");
				fifty.tests.methodsWork();
			}
		}
	//@ts-ignore
	)(fifty);

}
