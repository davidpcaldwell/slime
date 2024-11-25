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

	export interface Operations<T> {
		[x: string]: (t: T) => any
	}

	export type Specified<T,O extends Operations<T>> = {
		[Property in keyof O]: () => ReturnType<O[Property]>
	}

	export type Flattened<T,O extends Operations<T>> = {
		[Property in keyof O]: ReturnType<O[Property]>
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

			var console = (fifty.global.jsh) ? function(message) {
				jsh.shell.console(message);
			} : function(message) {
				//	do nothing in browser for now
			}

			var specify = function<T>(t: T): <O extends Operations<T>> (operations: O) => Specified<T,O> {
				return function(methods) {
					return Object.fromEntries(
						Object.entries(methods).map(function(entry) {
							return [
								entry[0],
								//	TODO	would be nice to defer implementation of this, but might require use of
								//			Object.defineProperty
								function() {
									return entry[1](t);
								}
							]
						})
					) as Specified<T,typeof methods>;
				}
			};

			var flatten = function<T,O extends Operations<T>>(specified: Specified<T,O>): Flattened<T,O> {
				var rv: slime.external.lib.typescript.Partial<Flattened<T,O>> = {};
				Object.entries(specified).forEach(function(entry) {
					rv = $api.Object.defineProperty({
						name: entry[0],
						descriptor: {
							enumerable: true,
							get: function() {
								return entry[1]();
							}
						}
					})(rv);
				})
				return rv as Flattened<T,O>;
			}

			var pin = function<T>(t: T): <O extends Operations<T>> (operations: O) => Flattened<T,O> {
				return function(operations) {
					return flatten(specify(t)(operations));
				}
			};

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

			fifty.tests.wip = function() {
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

	export type Script = slime.loader.Script<Context,Exports>
}
