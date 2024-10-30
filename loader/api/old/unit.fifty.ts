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

	export namespace test {
		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
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
				? fifty.global.$api.Object({ properties: parameters.form.controls })
				: void(0)
			;

			return { module, a, b, form };
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.jsapi = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Verify: slime.definition.verify.Export

		/**
		 * @deprecated Only used in implmenting an older section of JSAPI browser tests.
		 */
		EventsScope: slime.definition.unit.internal.EventsScope

		getStructure: Function

		/**
		 * @experimental
		 */
		View: {
			(o: view.Handler): View
			(f: view.Listener): View
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
					const toObject = function(a: any) {
						return a as {};
					}
					var suite = new subject.Suite({
						parts: {
							a: {
								initialize: function(scope) {
									scope.a = a;
								},
								execute: function(scope,verify) {
									verify(scope.a).evaluate(toObject).is(a);
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
		/**
		 * The part `id` of this part within its parent, or `null` if it is a top-level suite.
		 */
		id: string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { module, a, b } = test.fixtures;

			fifty.tests.jsapi._3 = function() {
				const verify = fifty.verify;
				verify(a).getParts().a.id.is("a");
				verify(b).getParts().a.id.is("a");
			}

			fifty.tests.jsapi._4 = function() {
				const verify = fifty.verify;
				var suite = new module.Suite();
				verify(suite).id.is(null);

				var s2 = new module.Suite({
					parts: {
						a: {
							parts: {
								b: {
									execute: function(scope,verify) {
									}
								}
							}
						}
					}
				});
				verify(s2).id.is(null);
				verify(s2).getParts().a.id.is("a");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Part {
		/**
		 * The name specified in the definition, if specified. Otherwise, the part `id` of this scenario within its parent.
		 */
		name: string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { module, a, b } = test.fixtures;

			fifty.tests.jsapi._5 = function() {
				verify(a).getParts().a.name.is("aname");
				verify(b).getParts().a.name.is("a");
			};

			fifty.tests.jsapi._6 = function() {
				var suite = new module.Suite({
					parts: {
						a: {
							parts: {
								b: {
									name: "bname",
									execute: function(scope,verify) {
									}
								}
							}
						}
					}
				});
				verify(suite).name.is(null);
				verify(suite).getParts().a.name.is("a");
				const asSuite = function(p: Part) { return p as Suite };
				verify(suite).getParts().a.evaluate(asSuite).getParts().b.name.is("bname");
			};
		}
	//@ts-ignore
	)(fifty);

	export interface Part {
		listeners: $api.event.Emitter<any>["listeners"]
	}

	export namespace part {
		export interface Properties {
			events: $api.event.Emitter<any>
			scope: any
			create: any
			find: any
			before: any
			initialize: any
			destroy: any
			after: any
		}

		export interface Definition {
			/** A name for that will be used for this {@link Part}. */
			name?: string
			/** @deprecated */
			create?: (this: Part) => void

			/**
			 * @param scope A scope object that is shared across the methods of this part.
			 */
			initialize?: (scope: { [x: string]: any }) => void

			/**
			 * @param scope A scope object that is shared across the methods of this part.
			 */
			destroy?: (scope: { [x: string]: any }) => void
		}

		export interface Context {
			id: string
			events: $api.event.Emitter<any>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var verify = fifty.$loader.module("../verify.js");

				var module: slime.definition.unit.Exports = fifty.$loader.module("unit.js", {
					api: {
						Promise: void(0)
					},
					verify: verify
				});

				fifty.tests.jsapi._2 = function() {
					var destroyed = false;
					var suite = new module.Suite({
						parts: {
							a: {
								name: "foo",
								execute: function(scope,verify) {
									debugger;
									verify(true).is(true);
								},
								destroy: function(scope) {
									destroyed = true;
								}
							}
						}
					});
					suite.run();
					fifty.verify(destroyed).is(true);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.jsapi.Scenario = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Scenario extends Part {
		fire: $api.event.Emitter<any>["fire"]
		promise: any
	}

	export interface Scenario extends Part {
		/**
		 * Executes the scenario.
		 *
		 * Executing this method may fire events as defined by {@link scenario.Events}.
		 *
		 * @returns Whether the scenario succeeded.
		 */
		run: (p: {
			/**
			 * The scope to use when invoking the methods of the scenario definition.
			 */
			scope: object
		}) => boolean
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const { module } = test.fixtures;

			fifty.tests.jsapi.Scenario.run = fifty.test.Parent();

			fifty.tests.jsapi.Scenario.run._1 = function() {
				var first = new module.Suite({
					parts: {
						a: {
							execute: function(scope,verify) {
								verify(true).is(true);
							}
						}
					}
				});
				var success = first.run();
				verify(success,"success").is(true);

				var second = new module.Suite({
					parts: {
						a: {
							execute: function(scope,verify) {
								verify(true).is(false);
							}
						}
					}
				});
				var result = second.run();
				verify(result,"success").is(false);
			}

			fifty.tests.jsapi.Scenario.run._2 = function() {
				var suite = new module.Suite({
					parts: {
						a: {
							name: "foo",
							execute: function(scope,verify) {
								verify(true).is(true);
							}
						}
					}
				});
				var starts: { detail: { start: { name: string } } }[] = [];
				var ends: { detail: { end: { name: string }, success: boolean } }[] = [];
				suite.listeners.add("scenario", function(e) {
					if (e.detail.start) {
						starts.push(e);
					} else if (e.detail.end) {
						ends.push(e);
					}
				});
				var rv = suite.run();
				verify(rv,"success").is(true);
				verify(starts)[1].detail.start.name.is("foo");
				verify(ends)[0].detail.end.name.is("foo");
				verify(ends)[0].detail.success.is(true);
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace scenario {
		/**
		 * An object specifying a {@link Scenario}.
		 */
		export interface Definition extends part.Definition {
			/**
			 * The implementation of a scenario. It can execute code, using the provided scope as necessary, and use its verifier to
			 * test that the code works correctly.
			 *
			 * @param scope A scope object that is shared across the methods of this scenario.
			 * @param verify An object that can be used to test conditions.
			 */
			execute: (scope: { [x: string]: any }, verify: slime.definition.verify.Verify) => void
		}

		export interface Events {
			/**
			 * An event of the first form, with `start`, is fired prior to the scenario executing.
			 *
			 * After executing, an event of the second type is fired, indicating the scenario ended and whether it succeeded.
			 *
			 * During execution, the verification object may fire additional `scenario` events if the scenario launches other
			 * scenarios.
			 */
			scenario: events.Detail

			test: {
				success: boolean
				message: string

				/**
				 * If present, indicates an uncaught error occurred while running the test.
				 */
				error?: Error
			}
		}

		export type Handler = slime.$api.event.Handlers<internal.scenario.Events>

		export namespace events {
			export interface Identifier {
				/**
				 * The part `id` of the scenario.
				 */
				id: string

				/**
				 * The `name` of the scenario.
				 */
				name: string
			}

			export interface Start {
				start: events.Identifier
			}

			export interface End {
				end: events.Identifier
				/**
				 * Whether the execution succeeded.
				 */
				success: boolean
			}

			export type Detail = Start | End
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.jsapi.Suite = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Suite extends Part {
		/**
		 * Adds (or replaces) a part of this suite.
		 *
		 * @param part A part `id`.
		 * @param definition A part that will have that ID.
		 */
		part: (part: string, definition: scenario.Definition) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const { module } = test.fixtures;

			fifty.tests.jsapi.Suite.run = function() {
				var suite = new module.Suite({
					parts: {
						a: {
							execute: function(scope,verify) {
								verify(1).is(1);
							}
						}
					}
				});

				var before = suite.run();
				verify(before).is(true);

				suite.part("a", {
					execute: function(scope,verify) {
						verify(1).is(2);
					}
				});

				var after = suite.run();
				verify(after).is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Suite extends Part {
		/**
		 * An object whose keys are part `id`s and whose values are {@link Part}s.
		 */
		parts: {
			[id: string]: Part
		}
	}

	export interface Suite extends Part {
		/** @deprecated */
		getParts: () => { [id: string]: Part }

		/**
		 * Executes this suite.
		 * @returns
		 */
		run: (p?: {
			/**
			 * (optional; default is an empty object) A set of properties that will be passed to the parts of this test.
			 */
			scope?: { [x: string]: any }

			/**
			 * (optional; default is an empty array) A list of part names that will be interpreted as a "path" to the part(s) to
			 * execute. For example, the array `["foo","bar"]` will lead to the `bar` part of the `foo` part of this suite being
			 * executed.
			 */
			path?: string[]
		}, next?: any) => boolean

		promise?: () => void

		/** @deprecated */
		scenario: any

		/** @deprecated */
		suite: any
	}

	export namespace suite {
		export interface Definition extends part.Definition {
			/**
			 * An object whose keys are part `id`s. The values are interpreted as follows:
			 *
			 * *  If the value has a `parts` property, it is interpreted as a {@link Definition | suite.Definition} and will create
			 * a {@link Suite} with the part `id` of its key.
			 * *  Otherwise, it is interpreted as a {@link scenario.Definition | scenario.Definition} and will create a
			 * {@link Scenario} with the the part `id` of its key.
			 */
			parts?: { [x: string]: scenario.Definition | suite.Definition }
		}
	}
}

namespace slime.definition.unit {
	export interface Exports {
		//	TODO	should not be using internal types in external definition
		/**
		 * A single `Scenario` can also be run under some circumstances.
		 */
		Scenario: new (
			definition: slime.definition.unit.internal.part.Definition,
			context: slime.definition.unit.internal.part.Context
		) => slime.definition.unit.internal.Scenario

		Suite: new (
			definition?: slime.definition.unit.internal.suite.Definition,
			context?: slime.definition.unit.internal.part.Context
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

	export interface View {
		listen: (scenario: $api.event.Emitter<any>) => void
		on: internal.scenario.Handler
	}

	export namespace view {
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
			const { verify } = fifty;

			fifty.tests.jsapi._1 = function() {
				verify(1).is(1);
				var x = verify("x");
				verify("x").length.is(1);
				var withHidden = { is: "hey", evaluate: "dude" };
				verify(withHidden,"withHidden").evaluate.property("is").is("hey");
				verify(withHidden,"withHidden").evaluate.property("evaluate").is("dude");

				var methodThrows = {
					method: function() {
						throw new Error("Wrong again, knave!")
					},
					works: function() {

					}
				};

				verify(methodThrows).evaluate(function() { return this.method(); }).threw.type(Error);
				verify(methodThrows).evaluate(function() { return this.method(); }).threw.message.is("Wrong again, knave!");
				verify(methodThrows).evaluate(function() { return this.works(); }).threw.nothing();
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const { module } = test.fixtures;

			fifty.tests.jsapi._7 = function() {
				var top = new module.Suite({
					name: "top",
					parts: {
						child: {
							name: "child",
							execute: function(scope,verify) {
								//	TODO	apparently this legacy property still exists at runtime
								//@ts-ignore
								verify.test(function() {
									return {
										success: true,
										message: "Hello, World!"
									}
								});
							}
						}
					}
				});
				var starts = [];
				var ends = [];
				var tests = [];
				top.listeners.add("scenario", function(e) {
					if (e.detail.start) {
						starts.push(e.detail);
						//	jsh.shell.echo("Start: " + e.detail.start.name);
					} else if (e.detail.end) {
						//	jsh.shell.echo("End: " + e.detail.end + " success=" + e.detail.success);
						ends.push(e.detail);
					}
				});
				top.listeners.add("test", function(e) {
					//	jsh.shell.echo("Test: " + e.detail.message);
					tests.push(e.detail);
				});
				top.run();
				verify(starts).length.is(2);
			}

			fifty.tests.jsapi._8 = function() {
				var top = new module.Suite({
					name: "top"
				});
				var starts = [];
				var ends = [];
				var tests = [];
				top.listeners.add("scenario", function(e) {
					if (e.detail.start) {
						starts.push(e.detail);
						//	jsh.shell.echo("Start: " + e.detail.start.name);
					} else if (e.detail.end) {
						//	jsh.shell.echo("End: " + e.detail.end + " success=" + e.detail.success);
						ends.push(e.detail);
					}
				});
				top.listeners.add("test", function(e) {
					//	jsh.shell.echo("Test: " + e.detail.message);
					tests.push(e.detail);
				});
				top.scenario("child", {
					create: function() {
						this.name = "child";

						this.execute = function(scope,verify) {
							verify.test(function() {
								return {
									success: true,
									message: "Hello, World!"
								}
							});
						}
					}
				});
				top.run();
				verify(starts).length.is(2);
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
