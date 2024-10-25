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
	export type evaluate<T> = {
		<R>(f: (t: T) => R): Subject<R> & {
			threw: Subject<Error> & {
				type: <E extends ErrorConstructor>(type: E) => void
				nothing: () => void
			}
		}

		/**
		 * Allows evaluating an arbitrary property of the given value in order to create a {@link Subject} wrapping that value.
		 * Although `Subject`s can already do this directly using {@link TargetSubject}, the `property` method has two additional
		 * uses:
		 *
		 * 1. It can be used even if the value of the property is `undefined`,
		 * 1. It can be used even on non-enumerable properties.
		 */
		property: any
		//	TODO	this didn't work for some reason; should revisit
		//property: (k: any) => Subject<any>
		//	TODO	this didn't work for some reason; should revisit
		//property: <K extends keyof T>(k: K) => Subject<T[K]>
	}

	export type is<T> = {
		/**
		 * Asserts that the subject value is === to the given value.
		 */
		(t: T): void

		/**
		 * Asserts that the subject value is of the given type. Types are the same as those given by the `typeof` JavaScript
		 * operator, except that `null` has the type `"null"` (rather than JavaScript `typeof null`, which is `"object"`).
		 */
		type: (name: string) => void

		not: {
			/**
			 * Asserts that the subject value is !== to the given value.
			 */
			(t: T): void

			/**
			 * Asserts that the subject value is != to the given value.
			 */
			equalTo: (t: T) => void
		}
	}

	/**
	 * Methods that support assertions on {@link Subject}s.
	 */
	export type AssertSubject<T> = {
		is: is<T>
		evaluate: evaluate<T>
	}

	/**
	 * Provides a {@link Subject} for each property of a given `Subject`'s value.
	 */
	export type TargetSubject<T> = {
		[K in keyof T]: Subject<T[K]>
	}

	/**
	 * For a {@link Subject} that is a function, makes the `Subject` callable and returns a `Subject` wrapping the return value of
	 * the call.
	 */
	export type MethodSubject<T extends (...args: any) => any> = AssertSubject<T> & {
		//	TODO	could we build the .threw stuff into MethodSubject as well?
		(...p: Parameters<T>): Subject<ReturnType<T>>
	}

	/**
	 * A `Subject` represents a value about which assertions can be made. A `Subject` has `is` and `evaluate` properties provided by
	 * {@link AssertSubject}, as well as (if it is an object) a `Subject` property for each of its value's enumerable properties,
	 * provided by {@link TargetSubject}. If it is a function, it also provides a function that invokes it and returns a `Subject`
	 * representing the value returned. If the value is an array, the `Subject` will also have a length property of type
	 * `Subject<number>` which represents the length of the array.
	 */
	export type Subject<T> = (
		TargetSubject<T>
		& (
			//	As of 4.7.3 (and seemingly for some time before that), TypeScript is decomposing the boolean type into true | false,
			//	which causes problems in the .is() method from AssertSubject, at least. So we handle booleans as a special case,
			//	here and in the Verify type.
			T extends Boolean
			? AssertSubject<boolean>
			: (
				T extends String
				? AssertSubject<string> & { length: Subject<number> }
				: (
					T extends (...args: any) => any
					? MethodSubject<T>
					: (
						T extends Array<any>
						? AssertSubject<T> & { length: Subject<number> }
						: AssertSubject<T>
					)
				)
			)
		)
	)

	/**
	 * A function that returns a {@link Subject}, which supports a convenient API for making assertions about a subject value.
	 * Practical examples can be found in the [`slime.definition.verify` tests](../src/loader/api/verify.fifty.ts?as=text).
	 */
	export type Verify = {
		<T>(value: boolean, name?: string, lambda?: (it: Subject<boolean>) => void): Subject<boolean>
		<T>(value: T, name?: string, lambda?: (it: Subject<T>) => void): Subject<T>
	}

	/**
	 * An object that can execute {@link slime.definition.unit.Test}s.
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

	export type Script = slime.loader.Script<void,Export>
}
