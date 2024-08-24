//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * An older module containing general JavaScript utilities.
 *
 * @deprecated Replaced by {@link slime.$api.Global}.
 */
namespace slime.$api.old {
	export interface Context {
		globals: boolean
	}

	export namespace test {
		export const Functions = function() {
			var calculator = Object.assign(function() {
				calculator.invocations++;
				return 2*2;
			}, {
				invocations: 0
			});

			var undefinedCalculator = Object.assign(function() {
				undefinedCalculator.invocations++;
				return;
			}, {
				invocations: 0
			});

			return {
				calculator: calculator,
				undefinedCalculator: undefinedCalculator
			};
		};
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
		 * Defines a property on an object which is lazy-instantiated by a function the first time it is accessed.
		 *
		 * The property is effectively constant. The first time the property is accessed, the given function will be invoked to
		 * define the value, which will be returned as the value (without invoking the function) each time it is accessed.
		 * The property will be enumerable.
		 *
		 * This function is only present if Object.defineProperty is available.
		 *
		 * @param a An object on which to define a property
		 * @param n The name of the property to define
		 * @param v The function that will be invoked to define the property's value, when/if necessary.
		 * @returns The object, augmented with the new property.
		 */
		lazy?: <T extends object,K extends string,V>(a: T, n: K, v: () => V) => T & { [k in K]: V }
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var module = fifty.$loader.module("module.js");

			var Functions = function() {
				var calculator = Object.assign(function() {
					calculator.invocations++;
					return 2*2;
				}, {
					invocations: 0
				});

				var undefinedCalculator = Object.assign(function() {
					undefinedCalculator.invocations++;
					return;
				}, {
					invocations: 0
				});

				this.calculator = calculator;
				this.undefinedCalculator = undefinedCalculator;
			}

			fifty.tests.exports.lazy = function() {
				var f = new Functions();

				var test = function(b) {
					verify(b).is(true);
				}

				var math = module.lazy({}, "four", f.calculator);
				test( f.calculator.invocations == 0 );
				test( math.four == 4 );
				test( f.calculator.invocations == 1 );
				test( math.four == 4 );
				test( f.calculator.invocations == 1 );

				math = module.lazy(math, "undefined", f.undefinedCalculator);
				test( f.undefinedCalculator.invocations == 0 );
				test( typeof(math.undefined) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
				test( typeof(math.undefined) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Creates a function which caches the result of an underlying function.
		 *
		 * It stores the result before returning it, and returns the stored result for every succeeding invocation.
		 *
		 * @param f A function to which the returned function will delegate the first time.
		 * @returns The created function.
		 */
		constant: <T>(f: () => T) => () => T
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var module: Exports = fifty.$loader.module("module.js");

			var test = function(b) {
				verify(b).is(true);
			}

			fifty.tests.exports.constant = function() {
				var f = old.test.Functions();

				var constantCalculator = module.constant(f.calculator);
				verify(f.calculator.invocations).is(0);
//					test( f.calculator.invocations == 0 );
				verify(constantCalculator()).is(4);
//					test( constantCalculator() == 4 );
				verify(f.calculator.invocations).is(1);
//					test( f.calculator.invocations == 1 );
				verify(constantCalculator()).is(4);
//					test( constantCalculator() == 4 );
				verify(f.calculator.invocations).is(1);
//					test( f.calculator.invocations == 1 );

				var undefinedConstantCalculator = module.constant(f.undefinedCalculator);
				test( f.undefinedCalculator.invocations == 0 );
				test( typeof(undefinedConstantCalculator()) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
				test( typeof(undefinedConstantCalculator()) == "undefined" );
				test( f.undefinedCalculator.invocations == 1 );
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		toLiteral: any
		ObjectTransformer: any
		properties: any
		Object: any
		Filter: any
		Map: any
		Order: any
		Array: any
		Error: any
		Task: any

		Function: slime.$api.Global["fp"]

		/**
		 * @deprecated
		 */
		deprecate: slime.$api.Global["deprecate"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.load("Error.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);
}
