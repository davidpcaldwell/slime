//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp.internal.methods {
	export interface Context {
		library: {
			Object: Pick<slime.$api.Global["Object"],"defineProperty">
		}
	}

	export type Script = slime.loader.Script<Context,slime.$api.fp.methods.Exports>
}

/**
 * See {@link Exports}.
 */
namespace slime.$api.fp.methods {
	export type Specified<T,O extends Operations<T>> = {
		[Property in keyof O]: () => ReturnType<O[Property]>
	}

	export type Flattened<T,O extends Operations<T>> = {
		[Property in keyof O]: ReturnType<O[Property]>
	}

	/**
	 * Provides a facility for creating world-oriented "methods."
	 *
	 * World-oriented methods provide some of the benefits of object-oriented methods -- binding functions to a particular value of
	 * a type -- without requiring object-oriented programming, where objects have encapsulated, perhaps mutable, state and methods
	 * operate on that state. World-oriented methods operate on data structures that have public state but provide the same sort
	 * of benefits in terms of producing a defined API for a given type that can be easily discovered and manipulate instances of
	 * that type.
	 */
	export interface Exports {
		/**
		 * Given a value of tyoe `T`, and a group of functions that operate on a given type `T`, creates a corresponding group of
		 * no-argument functions that invoke the given group of functions with the given value.
		 */
		specify: <T>(t: T) => <O extends Operations<T>> (operations: O) => Specified<T,O>

		/**
		 * Given an object consisting of a set of no-argument functions, creates an object with a property for each function whose
		 * values are the values obtained by invoking the functions. The function invocation is deferred via `Object.defineProperty`
		 * so that functions are not invoked until the given properties are referenced.
		 */
		flatten: <T,O extends Operations<T>>(specified: Specified<T,O>) => Flattened<T,O>

		/**
		 * Given a value of tyoe `T`, and a group of functions that operate on a given type `T`, creates a corresponding group of
		 * properties that represent the values produced by the group of functions when invoked on that type `T`. These functions
		 * are deferred using JavaScript's `Object.defineProperty` such that the property values will not be evaluated until
		 * accessed.
		 */
		pin: <T>(t: T) => <O extends Operations<T>> (operations: O) => Flattened<T,O>
	}

	export interface Operations<T> {
		[x: string]: (t: T) => any
	}

	export namespace fixture {
		export interface Context {
			scale: number
		}

		export interface Bar {
			value: number
		}

		export interface Module {
			foo: (context: Context) => number
			Bar: {
				asString: (context: Context) => (bar: Bar) => string
				asNumber: (context: Context) => (bar: Bar) => number
				squared: (context: Context) => (bar: Bar) => number
			}
		}

		export type InitializedBar = Specified<Context,Module["Bar"]>
		export type OfBar = Specified<Bar,Specified<Context,Module["Bar"]>>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const subject = fifty.global.$api.fp.methods;

			const { specify, flatten, pin } = subject;

			var console = (fifty.global.jsh) ? function(message) {
				jsh.shell.console(message);
			} : function(message) {
				//	do nothing in browser for now
			}

			var implementation: fixture.Module["Bar"] = {
				asString: function(context) {
					return function(bar) {
						console("asString: value=" + bar.value + " scale=" + context.scale);
						return String(bar.value * context.scale);
					}
				},
				asNumber: function(context) {
					return function(bar) {
						return bar.value * context.scale;
					}
				},
				squared: function(context) {
					return function(bar) {
						return bar.value * context.scale * bar.value * context.scale;
					}
				}
			};

			fifty.tests.suite = function() {
				var contextualized = specify({ scale: 2 });

				var configured = contextualized(implementation);
				console("configured");
				const bar: fixture.Bar = { value: 2 };
				var s = configured.asString()(bar);
				verify(s).is("4");
				var n = configured.asNumber()(bar);
				verify(n).is(4);

				var flattened = flatten(configured);
				console("flattened");
				var fs = flattened.asString(bar);
				verify(fs).is("4");
				var fn = flattened.asNumber(bar);
				verify(fn).is(4);

				var pinContext = pin({ scale: 2 });
				var pinned = pinContext(implementation);
				console("pinned");
				verify(pinned).asString(bar).is("4");
				verify(pinned).asNumber(bar).is(4);
				verify(pinned).squared(bar).is(16);

				var targeted = specify(bar)(flattened);
				console("targeted");
				verify(targeted).asString().is("4");
				verify(targeted).asNumber().is(4);
				verify(targeted).squared().is(16);
			}
		}
	//@ts-ignore
	)(fifty);
}
