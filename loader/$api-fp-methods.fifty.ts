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

	export type Specified<C,M extends Methods<C>> = {
		[Property in keyof M]: ReturnType<M[Property]>
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

			var specify = function<C>(c: C): <M extends Methods<C>> (methods: M) => Specified<C,M> {
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
					) as Specified<C,typeof methods>;
				}
			};

			var implementation: fixture.Module["Bar"] = {
				asString: function(context) {
					return function(bar) {
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

			fifty.tests.wip = function() {
				var contextualized = specify({ scale: 2 });

				var configured = contextualized(implementation);
				const bar: fixture.Bar = { value: 2 };
				var s = configured.asString(bar);
				verify(s).is("4");
				var n = configured.asNumber(bar);
				verify(n).is(4);

				var targeted = specify(bar)(configured);
				verify(targeted).asString.is("4");
				verify(targeted).asNumber.is(4);
				verify(targeted).squared.is(16);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
