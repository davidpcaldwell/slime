//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp.world {
	export namespace test {
		export namespace fixtures {
			export const doubler: Sensor<number, { got: number, argument: string, returning: number }, number> = function(p) {
				return function(events) {
					events.fire("got", p);
					events.fire("argument", String(p));
					const rv = p * 2;
					events.fire("returning", rv);
					return rv;
				}
			};

			export const sqrt: Sensor<number, { got: number, argument: string, returning: number }, Maybe<number>> = function(p) {
				return function(events) {
					if (p < 0) {
						return {
							present: false
						};
					}
					events.fire("got", p);
					events.fire("argument", String(p));
					const rv = Math.sqrt(p);
					events.fire("returning", rv);
					return {
						present: true,
						value: rv
					};
				}
			};

			export const NumberRecorder = (function(fifty: fifty.test.Kit) {
				return function() {
					var orders: number[] = [];

					var recorder: Means<number,{ got: number, length: number }> = function(s) {
						return function(events) {
							events.fire("got", s);
							orders.push(s);
							events.fire("length", orders.length);
						}
					};

					var captor = fifty.$api.Events.Captor({
						got: void(0),
						length: void(0)
					});

					return {
						recorder,
						captor,
						orders
					}
				};
			//@ts-ignore
			})(fifty);

			export const castToNumber: slime.js.Cast<number> = (function(fifty: fifty.test.Kit) {
				return fifty.global.$api.fp.cast.unsafe;
			//@ts-ignore
			})(fifty);
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.exports.world = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type Question<E,R> = (events: slime.$api.event.Producer<E>) => R
	export type Action<E> = (events: slime.$api.event.Producer<E>) => void

	export type Sensor<S,E,R> = (s: S) => Question<E,R>
	export type Means<O,E> = (o: O) => Action<E>

	export namespace sensor {
		export interface Exports {
			from: {
				/**
				 * Given a single function that takes an argument with `subject` and `events` properties, returns a `Sensor` that
				 * delegates to that function.
				 */
				flat: <S,E,R>(f: (p: { subject: S, events: slime.$api.event.Producer<E> }) => R) => Sensor<S,E,R>
			}
		}
	}

	export namespace sensor {
		export interface Exports {
			mapping: <S,E,R>(events?: slime.$api.event.Handlers<E>)
				=> (sensor: slime.$api.fp.world.Sensor<S,E,R>)
				=> slime.$api.fp.Mapping<S,R>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.world.Sensor = fifty.test.Parent();

			fifty.tests.exports.world.Sensor.mapping = function() {
				var captor = fifty.$api.Events.Captor({
					got: void(0),
					returning: void(0)
				});

				var mapping = $api.fp.world.Sensor.old.mapping({
					sensor: test.fixtures.doubler,
					handlers: captor.handler
				});

				verify(captor).events.length.is(0);
				verify(mapping(2)).is(4);
				verify(captor).events[0].type.is("got");
				verify(captor).events[0].detail.evaluate(Number).is(2);
				verify(captor).events[1].type.is("returning");
				verify(captor).events[1].detail.evaluate(Number).is(4);
				verify(mapping(8)).is(16);
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace sensor {
		export interface Exports {
			subject: <NS,S,E,R>(p: fp.Mapping<NS,S>) => (s: slime.$api.fp.world.Sensor<S,E,R>) => slime.$api.fp.world.Sensor<NS,E,R>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.world.Sensor.subject = function() {
					var sensor = $api.fp.now(
						test.fixtures.doubler,
						$api.fp.world.Sensor.subject( function(n: string) { return Number(n); } )
					);

					var captor = fifty.$api.Events.Captor({
						got: void(0),
						returning: void(0)
					});

					var mapping = $api.fp.now(sensor, $api.fp.world.Sensor.mapping(captor.handler));

					verify(captor).events.length.is(0);

					var result = mapping("5");

					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate( p => p as number ).is(5);
					verify(captor).events[1].type.is("returning");
					verify(captor).events[1].detail.evaluate( p => p as number).is(10);
					verify(result).is(10);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			reading: <S,E,R,NR>(p: fp.Mapping<R,NR>) => (s: slime.$api.fp.world.Sensor<S,E,R>) => slime.$api.fp.world.Sensor<S,E,NR>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.world.Sensor.reading = function() {
					var sensor = $api.fp.now(
						test.fixtures.doubler,
						$api.fp.world.Sensor.reading( function(n: number) { return "$" + n.toFixed(2); } )
					);

					var captor = fifty.$api.Events.Captor({
						got: void(0),
						returning: void(0)
					});

					var mapping = $api.fp.now(sensor, $api.fp.world.Sensor.mapping(captor.handler));

					verify(captor).events.length.is(0);

					var result = mapping(5);

					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate( p => p as number ).is(5);
					verify(captor).events[1].type.is("returning");
					verify(captor).events[1].detail.evaluate( p => p as number).is(10);
					verify(result).is("$10.00");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			/**
			 * @deprecated Can be replaced by composing `subject` and `reading`.
			 */
			map: <NS,S,E,R,NR>(p: {
				subject: slime.$api.fp.Mapping<NS,S>
				sensor?: slime.$api.fp.world.Sensor<S,E,R>
				reading?: slime.$api.fp.Mapping<R,NR>
			}) => slime.$api.fp.world.Sensor<NS,E,NR>
		}

		export interface Exports {
			input: <S,E,R>(p: {
				sensor: slime.$api.fp.world.Sensor<S,E,R>
				subject: S
				handlers?: slime.$api.event.Handlers<E>
			}) => slime.$api.fp.impure.External<R>

			now: <S,E,R>(p: {
				sensor: slime.$api.fp.world.Sensor<S,E,R>
				subject: S
				handlers?: slime.$api.event.Handlers<E>
			}) => R

			old: {
				mapping: <S,E,R>(p: {
					sensor: slime.$api.fp.world.Sensor<S,E,R>
					handlers?: slime.$api.event.Handlers<E>
				}) => slime.$api.fp.Mapping<S,R>
			}
		}
	}

	export type Simple<
		X extends slime.$api.fp.world.Sensor<any,any,any> | slime.$api.fp.world.Means<any,any>
	> = (
		X extends slime.$api.fp.world.Sensor<
			infer S,
			infer E,
			infer R
		>
		? slime.$api.fp.Mapping<S,R>
		: (
			X extends slime.$api.fp.world.Means<
				infer O,
				infer E
			>
			? slime.$api.fp.impure.Output<O>
			: never
		)
	)

	export namespace sensor {
		export namespace api {
			export type Simple<S,E,R> = {
				wo: Sensor<S,E,R>
				simple: Mapping<S,R>
			}

			export type Maybe<S,E,R> = {
				wo: Sensor<S,E,slime.$api.fp.Maybe<R>>
				maybe: Partial<S,R>
				simple: Mapping<S,R>
			}
		}

		export interface Exports {
			api: {
				simple: <S,E,R>(p: Sensor<S,E,R>) => api.Simple<S,E,R>
				maybe: <S,E,R>(p: Sensor<S,E,Maybe<R>>) => api.Maybe<S,E,R>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.world.Sensor.api = fifty.test.Parent();

				fifty.tests.exports.world.Sensor.api.simple = function() {
					var api = $api.fp.world.Sensor.api.simple(test.fixtures.doubler);

					var captor = fifty.$api.Events.Captor({
						got: void(0),
						returning: void(0)
					});

					var result = $api.fp.world.Sensor.now({
						sensor: api.wo,
						subject: 3,
						handlers: captor.handler
					});

					verify(captor).events.length.is(2);
					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate(Number).is(3);
					verify(captor).events[1].type.is("returning");
					verify(captor).events[1].detail.evaluate(Number).is(6);
					verify(result).is(6);

					verify(api).simple(4).is(8);
				};

				fifty.tests.exports.world.Sensor.api.maybe = function() {
					var api = $api.fp.world.Sensor.api.maybe(test.fixtures.sqrt);

					var captor = fifty.$api.Events.Captor({
						got: void(0),
						returning: void(0)
					});

					var result = $api.fp.world.Sensor.now({
						sensor: api.wo,
						subject: 9,
						handlers: captor.handler
					});

					verify(captor).events.length.is(2);
					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate(Number).is(9);
					verify(captor).events[1].type.is("returning");
					verify(captor).events[1].detail.evaluate(Number).is(3);
					verify(result).present.is(true);
					if (result.present) verify(result).value.is(3);

					fifty.run(
						function maybe() {
							var negative = api.maybe(-4);
							verify(negative).present.is(false);

							var positive = api.maybe(16);
							verify(positive).present.is(true);
							if (positive.present) verify(positive).value.is(4);
						}
					);

					fifty.run(
						function simple() {
							var positive = api.simple(25);
							verify(positive).is(5);
						}
					);
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		/**
		 * @deprecated Replaced by `Sensor.mapping`.
		 */
		mapping: <P,E,A>(question: world.Sensor<P,E,A>, handler?: slime.$api.event.Handlers<E>) => fp.Mapping<P,A>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.world.mapping = function() {
				var captor = fifty.$api.Events.Captor({
					argument: void(0)
				});
				var map = $api.fp.now(
					test.fixtures.doubler,
					$api.fp.world.Sensor.mapping(captor.handler)
				);

				verify(captor).events.length.is(0);
				verify(2).evaluate(map).is(4);
				verify(captor).events.length.is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Sensor: sensor.Exports
	}

	export namespace means {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.world.Means = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			from: {
				flat: <O,E>(f: (p: { order: O, events: slime.$api.event.Producer<E> }) => void) => Means<O,E>
			}
		}

		export interface Exports {
			order: {
				<P,R,E>(mapping: slime.$api.fp.Mapping<P,R>): (means: Means<R,E>) => Means<P,E>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.world.Means.order = function() {
					var { orders, captor, recorder } = test.fixtures.NumberRecorder();

					var effect = $api.fp.now(
						recorder,
						$api.fp.world.Means.order(function(s: string): number { return Number(s) * 2; }),
						$api.fp.world.Means.effector(captor.handler)
					);

					verify(orders).length.is(0);
					verify(captor).events.length.is(0);

					effect("2");

					verify(orders).length.is(1);
					verify(orders)[0].is(4);

					verify(captor).events.length.is(2);
					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate(test.fixtures.castToNumber).is(4);
					verify(captor).events[1].type.is("length");
					verify(captor).events[1].detail.evaluate(test.fixtures.castToNumber).is(1);
				};
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			/** @deprecated Can be replaced by using `order`. */
			map: <P,R,E>(p: {
				order: slime.$api.fp.Mapping<P,R>
				means: slime.$api.fp.world.Means<R,E>
			}) => slime.$api.fp.world.Means<P,E>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.world.Means.map = function() {
					var { orders, captor, recorder } = test.fixtures.NumberRecorder();

					var mapped = $api.fp.world.Means.map({
						order: function(s: string): number { return Number(s) * 2; },
						means: recorder
					});

					verify(orders).length.is(0);
					verify(captor).events.length.is(0);
					$api.fp.world.now.action(mapped, "2", captor.handler);
					verify(orders).length.is(1);
					verify(orders)[0].is(4);
					verify(captor).events.length.is(2);
					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate(test.fixtures.castToNumber).is(4);
					verify(captor).events[1].type.is("length");
					verify(captor).events[1].detail.evaluate(test.fixtures.castToNumber).is(1);
				};
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			output: <O,E>(p: {
				means: slime.$api.fp.world.Means<O,E>
				handlers?: slime.$api.event.Handlers<E>
			}) => impure.Output<O>

			effector: <O,E>(events?: slime.$api.event.Handlers<E>)
				=> (means: slime.$api.fp.world.Means<O,E>) => impure.Effector<O>

			process: <O,E>(p: {
				means: slime.$api.fp.world.Means<O,E>
				order: O
				handlers?: slime.$api.event.Handlers<E>
			}) => slime.$api.fp.impure.Process

			now: <O,E>(p: {
				means: slime.$api.fp.world.Means<O,E>
				order: O
				handlers?: slime.$api.event.Handlers<E>
			}) => void
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.world.Means.output = function() {
					var { orders, captor, recorder } = test.fixtures.NumberRecorder();

					var output = $api.fp.world.Means.output({
						means: recorder,
						handlers: captor.handler
					});

					verify(orders).length.is(0);
					verify(captor).events.length.is(0);

					output(2);
					verify(orders).length.is(1);
					verify(orders)[0].is(2);
					verify(captor).events.length.is(2);
					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate(test.fixtures.castToNumber).is(2);
					verify(captor).events[1].type.is("length");
					verify(captor).events[1].detail.evaluate(test.fixtures.castToNumber).is(1);
				}

				fifty.tests.exports.world.Means.process = function() {
					var { orders, captor, recorder } = test.fixtures.NumberRecorder();
					verify(orders).length.is(0);
					verify(captor).events.length.is(0);

					var process = $api.fp.world.Means.process({
						means: recorder,
						order: 2,
						handlers: captor.handler
					});
					verify(orders).length.is(0);
					verify(captor).events.length.is(0);

					process();
					verify(orders).length.is(1);
					verify(orders)[0].is(2);
					verify(captor).events.length.is(2);
					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate(test.fixtures.castToNumber).is(2);
					verify(captor).events[1].type.is("length");
					verify(captor).events[1].detail.evaluate(test.fixtures.castToNumber).is(1);
				};

				fifty.tests.exports.world.Means.now = function() {
					var { orders, captor, recorder } = test.fixtures.NumberRecorder();
					verify(orders).length.is(0);
					verify(captor).events.length.is(0);

					$api.fp.world.Means.now({
						means: recorder,
						order: 2,
						handlers: captor.handler
					});
					verify(orders).length.is(1);
					verify(orders)[0].is(2);
					verify(captor).events.length.is(2);
					verify(captor).events[0].type.is("got");
					verify(captor).events[0].detail.evaluate(test.fixtures.castToNumber).is(2);
					verify(captor).events[1].type.is("length");
					verify(captor).events[1].detail.evaluate(test.fixtures.castToNumber).is(1);
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace means {
		export namespace api {
			export type Simple<O,E> = {
				wo: Means<O,E>
				simple: slime.$api.fp.impure.Effector<O>
			}
		}

		export interface Exports {
			api: {
				//	TODO	no test coverage, and had bug
				simple: <O,E>(p: Means<O,E>) => api.Simple<O,E>
			}
		}
	}

	export interface Exports {
		Means: means.Exports
	}

	export interface Exports {
		Process: {
			/** @deprecated Replaced by Means.process() */
			action: <P,E>(p: {
				action: Means<P,E>,
				argument: P,
				handlers: slime.$api.event.Handlers<E>
			}) => impure.Process
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.world.Process = {};
			fifty.tests.exports.world.Process.action = function() {
				var buffer: number[] = [];

				var action: world.Means<number, { got: number }> = function(p) {
					return function(events) {
						events.fire("got", p);
					}
				};

				var process = $api.fp.world.Process.action({
					action: action,
					argument: 2,
					handlers: {
						got: function(e) {
							buffer.push(e.detail);
						}
					}
				});

				verify(buffer).length.is(0);
				process();
				verify(buffer).length.is(1);
				verify(buffer)[0].is(2);
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace question {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.world.Question = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			now: <E,A>(p: {
				question: world.Question<E,A>
				handlers?: slime.$api.event.Handlers<E>
			}) => A

			thunk: <E,T>(handler?: slime.$api.event.Handlers<E>) => (ask: slime.$api.fp.world.Question<E,T>) => slime.$api.fp.impure.External<T>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.world.Question.now = function() {
					interface Events {
						intermediate: {
							input: number
							value: number
						}
					}

					var sixFactorial: slime.$api.fp.world.Question<Events,number> = function(events) {
						var rv = 1;
						for (var i=1; i<=6; i++) {
							rv *= i;
							events.fire("intermediate", { input: i, value: rv });
						}
						return rv;
					};

					var events: Events["intermediate"][] = [];

					var result = $api.fp.world.Question.now({
						question: sixFactorial,
						handlers: {
							intermediate: function(e) {
								events.push(e.detail);
							}
						}
					});

					verify(result).is(720);
					verify(events).length.is(6);
					verify(events)[2].input.is(3);
					verify(events)[2].value.is(6);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		output: <P,E>(action: world.Means<P,E>, handler?: slime.$api.event.Handlers<E>) => impure.Output<P>

		process: <E>(tell: world.Action<E>, handler?: slime.$api.event.Handlers<E>) => impure.Process

		input: <E,A>(ask: world.Question<E,A>, handler?: slime.$api.event.Handlers<E>) => impure.Input<A>

		Question: question.Exports & {
			/**
			 * An operation equivalent to {@link Exports | pipe(argument, question)}, but limited to one argument which provides
			 * more readable type inference, mapping the produced value to a `Sensor` rather than a function returning a `Question`.
			 */
			pipe: <I,P,E,A>(argument: (i: I) => P, question: world.Sensor<P,E,A>) => world.Sensor<I,E,A>
			map: <P,E,A,O>(question: world.Sensor<P,E,A>, map: (a: A) => O) => world.Sensor<P,E,O>
			wrap: <I,P,E,A,O>(argument: (i: I) => P, question: world.Sensor<P,E,A>, map: (a: A) => O) => world.Sensor<I,E,O>
		}

		Action: {
			/** @deprecated Use `Means.effect`. */
			output: <P,E>(handlers?: slime.$api.event.Handlers<E>) => (action: slime.$api.fp.world.Means<P,E>) => slime.$api.fp.impure.Output<P>

			tell: <P,E>(p: P) => (action: world.Means<P,E>) => world.Action<E>

			/**
			 * @deprecated See `Means.map`.
			 *
			 * Transforms an `Action` into an `Action` of a different argument type using a given function to map the
			 * argument.
			 *
			 * @param mapping A function that transforms a value of the desired argument type into the original Action's
			 * argument type.
			 *
			 * @returns An action which accepts the desired type.
			 */
			pipe: <P,R,E>(mapping: slime.$api.fp.Mapping<P,R>) => (action: slime.$api.fp.world.Means<R,E>) => slime.$api.fp.world.Means<P,E>

			process: <E>(events?: slime.$api.event.Handlers<E>) => (action: slime.$api.fp.world.Action<E>) => slime.$api.fp.impure.Process

			old: {
				process: <E>(p: {
					action: slime.$api.fp.world.Action<E>
					handlers?: slime.$api.event.Handlers<E>
				}) => slime.$api.fp.impure.Process
			}

			now: <E>(p: {
				action: slime.$api.fp.world.Action<E>
				handlers?: slime.$api.event.Handlers<E>
			}) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.world.Action = fifty.test.Parent();

			fifty.tests.exports.world.Action.pipe = function() {
				var buffer: number[] = [];

				var addNext: Means<number,void> = function(p) {
					return function(e) {
						buffer.push(p);
					}
				};

				var allowString = $api.fp.world.Action.pipe(function(s: string) { return Number(s); });

				var addAsNumber: Means<string,void> = allowString(addNext);

				verify(buffer).length.is(0);

				$api.fp.world.Means.now({
					means: addNext,
					order: 2
				});
				verify(buffer).length.is(1);
				verify(buffer)[0].is(2);

				$api.fp.world.Means.now({
					means: addAsNumber,
					order: "3"
				});
				verify(buffer).length.is(2);
				verify(buffer)[1].is(3);
			}

			fifty.tests.exports.world.Action.now = function() {
				var buffer: number[] = [];

				var addTwo: Action<{ length: number }> = function(events) {
					buffer.push(2);
					events.fire("length", buffer.length);
				};

				$api.fp.world.Action.now({
					action: addTwo
				});

				var lengthNow: number;

				$api.fp.world.Action.now({
					action: addTwo,
					handlers: {
						length: function(e) {
							lengthNow = e.detail;
						}
					}
				});

				verify(buffer).length.is(2);
				verify(lengthNow).is(2);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		events: {
			handle: <E>(handlers: slime.$api.event.Handlers<E>) => {
				action: (action: Action<E>) => impure.Process
				question: <R>(question: Question<E,R>) => impure.External<R>
			}

			ignore: {
				action: <E>(action: Action<E>) => impure.Process
				question: <E,R>(question: Question<E,R>) => impure.External<R>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			interface Events {
				console: string
			}

			var question: Question<Events,number> = function(events) {
				events.fire("console", "asked");
				events.fire("console", "answering 2");
				return 2;
			};

			var action: Action<Events> = function(events) {
				events.fire("console", "affecting");
			};

			fifty.tests.exports.world.handle = fifty.test.Parent();

			fifty.tests.exports.world.handle.events = function() {
				var castToString = function(v: any): string { return v; };

				fifty.run(
					function() {
						var captor = fifty.$api.Events.Captor({
							console: void(0)
						});

						//	TODO	this property should be named captor.handlers
						var handle = $api.fp.world.events.handle(captor.handler);

						var answer = $api.fp.now(
							question,
							handle.question,
							//	TODO	standardize
							function(v) {
								debugger;
								return v;
							},
							$api.fp.impure.now.input
						);

						verify(answer).is(2);
						verify(captor).events.length.is(2);
						//	TODO	can we make captors typesafe?
						verify(captor).events[0].detail.evaluate(castToString).is("asked");

						$api.fp.now(
							action,
							handle.action,
							$api.fp.impure.Process.now
						);

						verify(captor).events.length.is(3);
						//	TODO	can we make captors typesafe?
						verify(captor).events[2].detail.evaluate(castToString).is("affecting");
					}
				);

				fifty.run(
					function() {
						var captor = fifty.$api.Events.Captor({
							console: void(0)
						});

						//	TODO	this property should be named captor.handlers
						var handle = $api.fp.world.events.ignore;

						var answer = $api.fp.now(
							question,
							handle.question,
							//	TODO	standardize
							function(v) {
								debugger;
								return v;
							},
							$api.fp.impure.now.input
						);

						verify(answer).is(2);
						verify(captor).events.length.is(0);

						$api.fp.now(
							action,
							handle.action,
							$api.fp.impure.Process.now
						);

						verify(captor).events.length.is(0);
					}
				)
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		now: {
			/**
			 * @deprecated Replaced by `Sensor.now()`
			 */
			question: <P,E,A>(question: world.Sensor<P,E,A>, argument: P, handler?: slime.$api.event.Handlers<E>) => A

			/**
			 * @deprecated Replaced by `Means.now()`
			 */
			action: <P,E>(action: world.Means<P,E>, argument?: P, handler?: slime.$api.event.Handlers<E>) => void

			ask: <E,A>(ask: world.Question<E,A>, handler?: slime.$api.event.Handlers<E>) => A

			/**
			 * @deprecated Replaced by Action.now()
			 */
			tell: <E>(tell: world.Action<E>, handler?: slime.$api.event.Handlers<E>) => void
		}

		/** @deprecated Used almost entirely for `jsh.shell.tools.node.require`. After refactoring that, reassess. */
		execute: <E>(tell: world.Action<E>, handler?: slime.$api.event.Handlers<E>) => void

	}

	export interface Exports {
		api: {
			single: <P,E,R>(f: (x: { argument: P, events: slime.$api.event.Emitter<E> }) => R) => (p: P) => (e: slime.$api.event.Emitter<E>) => R
		}
	}

	export type Subject<
		X extends slime.$api.fp.world.Sensor<any,any,any>
	> = (
		X extends slime.$api.fp.world.Sensor<
			infer S,
			infer E,
			infer R
		>
		? S
		: never
	)

	export type Reading<
		X extends slime.$api.fp.world.Sensor<any,any,any>
	> = (
		X extends slime.$api.fp.world.Sensor<
			infer S,
			infer E,
			infer R
		>
		? R
		: never
	)

	export type Order<
		X extends slime.$api.fp.world.Means<any,any>
	> = (
		X extends slime.$api.fp.world.Means<
			infer O,
			infer E
		>
		? O
		: never
	)

	export type Events<
		X extends slime.$api.fp.world.Sensor<any,any,any> | slime.$api.fp.world.Means<any,any>
	> = (
		X extends slime.$api.fp.world.Sensor<
			infer S,
			infer E,
			infer R
		>
		? E
		: (
			X extends slime.$api.fp.world.Means<
				infer O,
				infer E
			>
			? E
			: never
		)
	)

	/** @deprecated */
	export namespace old {
		/** @deprecated */
		export type Ask<E,T> = (on?: slime.$api.event.Handlers<E>) => T

		/** @deprecated */
		export type Tell<E> = (on?: slime.$api.event.Handlers<E>) => void

		/** @deprecated */
		export type Action<P,E> = (p?: P) => Tell<E>

		/** @deprecated Identical to {@link Ask} but has slightly different semantics (analogous to HTTP POST). */
		export type Operation<E,R> = (on?: slime.$api.event.Handlers<E>) => R
	}

	export interface Exports {
		/** @deprecated */
		old: {
			/** @deprecated */
			ask: <E,T>(f: (events: slime.$api.event.Emitter<E>) => T) => world.old.Ask<E,T>
			/** @deprecated */
			tell: <E>(f: (events: slime.$api.event.Emitter<E>) => void) => world.old.Tell<E>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.world.old = fifty.test.Parent();

			fifty.tests.exports.world.old.ask = function() {
				type E = {
					called: void
				};

				type T = {
					number: number
				}

				var implementation = function(events: slime.$api.event.Emitter<E>): T {
					events.fire("called");
					return {
						number: 3
					};
				}

				var captor = fifty.$api.Events.Captor({
					called: void(0)
				});

				verify(captor).events.length.is(0);

				var ask = $api.fp.world.old.ask(implementation);

				var returned = ask(captor.handler);
				verify(captor).events.length.is(1);
				verify(returned).number.is(3);
			}


			fifty.tests.exports.world.old.tell = function() {
				type E = {
					called: void
				};

				var effects: { number: number }[] = [];

				var implementation = function(events: slime.$api.event.Emitter<E>) {
					events.fire("called");
					effects.push({ number: 3 });
				}

				var captor = fifty.$api.Events.Captor({
					called: void(0)
				});

				verify(captor).events.length.is(0);
				verify(effects).length.is(0);

				var tell = $api.fp.world.old.tell(implementation);

				tell(captor.handler);
				verify(captor).events.length.is(1);
				verify(effects).length.is(1);
				verify(effects)[0].number.is(3);
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.$api.fp.internal.world {
	export interface Context {
		now: slime.$api.fp.Now_map
		Partial: slime.$api.fp.Exports["Partial"]
		pipe: slime.$api.fp.Pipe
		events: slime.runtime.internal.events.Exports

		impure: slime.$api.fp.impure.Exports
	}

	export interface Exports {
		world: slime.$api.fp.world.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.runtime.loader.Scoped<Context,Exports>
}
