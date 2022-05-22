//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

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
			preprocessing: any

			value: {
				UNDEFINED: object
			}

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
			const $api = fifty.global.$api as unknown as Exports;

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi.mutating = function() {
				type T = { foo?: string, a?: string }
				var object = {
					foo: "bar"
				};

				var mutating = $api.Function.mutating(function(p) {
					p.foo = "baz";
				} as slime.$api.fp.old.Mutator<T>);

				var result = mutating(object);
				verify(result).foo.is("baz");
				verify(result).is(object);

				var swapper = $api.Function.mutating(function(p) {
					return { a: "b" }
				}) as slime.$api.fp.old.Mutator<T>;

				var swap = swapper(object);
				verify(swap).a.is("b");
				verify(swap).is.not(object);

				var voiding = $api.Function.mutating(function(p) {
					return $api.Function.value.UNDEFINED;
				});

				var voided = {
					value: voiding(object)
				};
				verify(voided).evaluate.property("value").is(void(0));

				var k = { foo: "k" };
				var valuer = $api.Function.mutating(k);
				var valued = valuer(object);
				verify(valued).foo.is("k");
				verify(valued).is.not(object);

				object = {
					foo: "bar"
				};
				var missinger: (t: T) => T = $api.Function.mutating(void(0));
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