//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp.methods {
	export interface Context {
	}

	export interface Exports {
	}

	export interface Methods<T> {
		[x: string]: (t: T) => any
	}

	export type Initialized<C,M extends Methods<C>> = {
		[Property in keyof M]: ReturnType<M[Property]>
	}

	export namespace fixture {
		export interface Context {
			multiplier: number
		}

		export interface Bar {
			value: number
		}

		export interface Module {
			foo: (context: Context) => number
			Bar: {
				baz: (context: Context) => (bar: Bar) => string
				bizzy: (context: Context) => (bar: Bar) => number
			}
		}

		export type InitializedBar = Initialized<Context,Module["Bar"]>
		export type OfBar = Initialized<Bar,Initialized<Context,Module["Bar"]>>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			var initialize = function<C>(c: C): <M extends Methods<C>> (methods: M) => Initialized<C,M> {
				return function(methods) {
					return Object.fromEntries(
						Object.entries(methods).map(function(entry) {
							return [
								entry[0],
								//	TODO	would be nice to defer implementation of this, but might require use of
								//			Object.defineProperty
								entry[1](c)
							]
						})
					) as Initialized<C,typeof methods>;
				}
			};

			var implementation: fixture.Module["Bar"] = {
				baz: function(context) {
					return function(bar) {
						return String(bar.value * context.multiplier);
					}
				},
				bizzy: function(context) {
					return function(bar) {
						return bar.value * context.multiplier;
					}
				}
			};

			fifty.tests.wip = function() {
				var contextualized = initialize({ multiplier: 2 });

				var m = contextualized(implementation);
				const bar: fixture.Bar = { value: 2 };
				var s = m.baz(bar);
				verify(s).is("4");
				var n = m.bizzy(bar);
				verify(n).is(4);

				var objectified = initialize(bar)(m);
				verify(objectified).baz.is("4");
				verify(objectified).bizzy.is(4);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
