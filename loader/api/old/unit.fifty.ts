//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.Kit
	) {

	}
//@ts-ignore
)(fifty);

namespace slime.definition.unit {
	export interface Context {
		verify: slime.definition.verify.Export
		log?: (message: string, p: any) => void
		api: {
			Promise: () => PromiseConstructorLike & { all: Function, resolve: Function }
		}
	}

	export interface Exports {
		Verify: slime.definition.verify.Export

		/**
		 * @deprecated Only used in implmenting an older section of JSAPI browser tests.
		 */
		EventsScope: slime.definition.unit.internal.EventsScope

		getStructure: Function

		View: {
			(o: View.Handler): View
			(f: View.Listener): View
		}

		JSON: {
			Encoder: (o: {
				send: (json: string) => void
			}) => View

			Decoder: () => {
				/**
				 * A property that allows listeners to be added to / removed from the underlying event emitter.
				 */
				listeners: $api.event.Emitter<any>["listeners"]

				/**
				 * Fires the decoded event to this decoder's listeners.
				 */
				decode: (json: string) => void
			}
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.definition.unit.internal {
	export const { subject, types } = (function(fifty: slime.fifty.test.Kit) {
		var Promise = (fifty.global.window) ? fifty.global.window["Promise"] : void(0);
		const code = fifty.$loader.script("unit.js") as slime.definition.unit.Script;

		const scripts: { verify: slime.definition.verify.Script } = {
			verify: fifty.$loader.script("../verify.js")
		}

		const subject = code({
			api: {
				Promise: Promise
			},
			verify: scripts.verify()
		});

		return {
			subject: subject,
			types: {
				definition: function types_definition() {
					const verify = fifty.verify;

					//	TODO	add test for error being thrown

					var a = {};
					var suite = new subject.Suite({
						parts: {
							a: {
								initialize: function(scope) {
									scope.a = a;
								},
								execute: function(scope,verify) {
									verify(scope.a).is(a);
								}
							}
						}
					});
					var rv = suite.run() as boolean;
					verify(rv,"success").is(true);

					//	TODO	add tests for suite
				}
			}
		}
	//@ts-ignore
	})(fifty);

	export type EventsScope = (o: { events: $api.event.Emitter<any> }) => slime.definition.unit.Scope

	export interface Part {
		id: any
		name: any
		listeners: $api.event.Emitter<any>["listeners"]
	}

	export namespace Part {
		export interface Properties {
			events: $api.event.Emitter<any>
			scope: any
			create: any
			find: any
			before: any
			initialize: any
			after: any
		}

		export interface Definition {
			name?: any
			/** @deprecated */
			create?: (this: Part) => void
		}

		export interface Context {
			id: any
			events: $api.event.Emitter<any>
		}
	}

	export interface Scenario extends Part {
		fire: $api.event.Emitter<any>["fire"]
		run: any
		promise: any
	}

	export interface Suite extends Part {
		/** @deprecated */
		getParts: any
		part: any
		run: () => boolean
		promise?: () => void

		/** @deprecated */
		scenario: any

		/** @deprecated */
		suite: any
	}

	export namespace Suite {
		export interface Definition extends Part.Definition {
			parts: { [x: string]: any }
		}
	}
}

namespace slime.definition.unit {
	export interface Exports {
		//	TODO	should not be using internal types in external definition
		Scenario: new (
			definition: slime.definition.unit.internal.Part.Definition,
			context: slime.definition.unit.internal.Part.Context
		) => slime.definition.unit.internal.Scenario

		Suite: new (
			definition: slime.definition.unit.internal.Suite.Definition,
			context?: slime.definition.unit.internal.Part.Context
		) => slime.definition.unit.internal.Suite
	}
}

namespace slime.definition.unit {
	type Verify = slime.definition.verify.Verify & {
		test: Function
		suite: Function
		scope: Function
		scenario: Function
		fire: Function
	}

	export type Test = {
		(): Test.Result
	}

	export namespace Test {
		export interface Result {
			success: boolean
			error?: any
			message: string
		}
	}

	export interface Scope {
		test(assertion: Test)
		error: any
		verify: any
		success: boolean
		fire: any
		checkForFailure: any
	}

	export namespace Event {
		export interface Scenario {
			id: any
			name: any
		}

		export namespace Scenario {
			export type Start = {
				start: Event.Scenario
			}

			type End = {
				end: Event.Scenario
				success: boolean
			}

			export type Detail = Start | End
		}

		export type Handler = slime.$api.event.Handlers<{
			scenario: Event.Scenario.Detail
			test: Test.Result
		}>
	}

	export interface View {
		listen: (scenario: $api.event.Emitter<any>) => void
		on: Event.Handler
	}

	export namespace View {
		export type Error = {
			type: string
			message: string
			stack: string
		}

		export type Handler = {
			start: (scenario: {
				name: string
			}) => void

			test: (result: Test.Result) => void

			end: (
				scenario: {
					name: string
				},
				success: boolean
			) => void
		}

		export type Listener = $api.event.Handler<any>

		export type Argument = Handler | Listener
	}
}

namespace slime.definition.unit {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api } = fifty.global;

			fifty.tests.jsapi = fifty.test.Parent();

			var verify = fifty.$loader.module("../verify.js");

			var module: slime.definition.unit.Exports = fifty.$loader.module("unit.js", {
				api: {
					Promise: void(0)
				},
				verify: verify
			});

			var a = new module.Suite({
				name: "a",
				parts: {
					a: {
						name: "aname",
						execute: function(scope,verify) {
							verify(1).is(1);
						}
					}
				}
			});

			var b = new module.Suite({
				name: "b",
				parts: {
					a: {
						execute: function(scope,verify) {
							verify(1).is(1);
						}
					}
				}
			});

			var parameters = {
				form: void(0)
			};

			var form = (parameters && parameters.form)
				? $api.Object({ properties: parameters.form.controls })
				: void(0)
			;

			fifty.tests.jsapi._1 = function() {
				var v = fifty.verify;
				v(1).is(1);
				var x = v("x");
				v("x").length.is(1);
				var withHidden = { is: "hey", evaluate: "dude" };
				v(withHidden,"withHidden").evaluate.property("is").is("hey");
				v(withHidden,"withHidden").evaluate.property("evaluate").is("dude");

				var methodThrows = {
					method: function() {
						throw new Error("Wrong again, knave!")
					},
					works: function() {

					}
				};

				v(methodThrows).evaluate(function() { return this.method(); }).threw.type(Error);
				v(methodThrows).evaluate(function() { return this.method(); }).threw.message.is("Wrong again, knave!");
				v(methodThrows).evaluate(function() { return this.works(); }).threw.nothing();
			}

		}
	//@ts-ignore
	)(fifty);
}

namespace slime.definition.unit {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(internal.types.definition);

				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);
}
