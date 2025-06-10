//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp {
	export interface Exports {
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

		/**
		 * @deprecated
		 */
		value: {
			UNDEFINED: object
		}
	}
}
namespace slime.$api.fp.internal.old {
	export interface Context {
		deprecate: slime.$api.Global["deprecate"]
	}

	/**
	 * @returns A return value that will replace the original function's return value, or `undefined` to leave that return value in
	 * place.
	 */
	export type Postprocessor = (p: any) => any

	export interface Exports {
		Function: {
			value: slime.$api.fp.Exports["value"]
			mutating: slime.$api.fp.Exports["mutating"]

			Basic: any
			Revise: any
			Prepare: any
			singleton: any
			set: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const $api = fifty.global.$api;

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi.mutating = function() {
				type T = { foo?: string, a?: string }
				var object = {
					foo: "bar"
				};

				var mutating = $api.fp.mutating(function(p) {
					p.foo = "baz";
				} as slime.$api.fp.old.Mutator<T>);

				var result = mutating(object);
				verify(result).foo.is("baz");
				verify(result).is(object);

				var swapper = $api.fp.mutating(function(p) {
					return { a: "b" }
				}) as slime.$api.fp.old.Mutator<T>;

				var swap = swapper(object);
				verify(swap).a.is("b");
				verify(swap).is.not(object);

				var voiding = $api.fp.mutating(function(p) {
					return $api.fp.value.UNDEFINED;
				});

				var voided = {
					value: voiding(object)
				};
				verify(voided).evaluate.property("value").is(void(0));

				var k = { foo: "k" };
				var valuer = $api.fp.mutating(k);
				var valued = valuer(object);
				verify(valued).foo.is("k");
				verify(valued).is.not(object);

				object = {
					foo: "bar"
				};
				var missinger: (t: T) => T = $api.fp.mutating(void(0));
				var missinged = missinger(object);
				verify(missinged).foo.is("bar");
				verify(missinged).is(object);

				var dummy = {};
				verify(dummy).evaluate(function() {
					return mutating();
				}).threw.type(TypeError);
				verify(dummy).evaluate(function() {
					return mutating({});
				}).threw.nothing();
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
