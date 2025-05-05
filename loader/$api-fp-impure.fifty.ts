//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp {
	export interface Exports {
		impure: slime.$api.fp.impure.Exports
		world: slime.$api.fp.world.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.impure = fifty.test.Parent();
			fifty.tests.exports.world = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.$api.fp.impure {
	/**
	 * A function capable of observing some kind of external state and obtaining and returning it to the caller.
	 */
	export type External<T> = () => T

	/** @deprecated Replaced by `External` and `Thunk` (for non-external operations). */
	export type Input<T> = () => T

	/**
	 * An impure function, with side effects, that is capable of effecting some kind of external change. Its argument
	 * represents the change to effect.
	 */
	export type Effect<T> = (t: T) => void

	/** @deprecated Replaced by `Effect` and {@link slime.$api.oo.Modifier}. */
	export type Output<T> = (t: T) => void

	export type Process = () => void

	export namespace exports {
		export interface Input {
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.impure.Input = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Input {
			value: Input_value
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.impure.Input.value = function() {
					var triple = function(n) { return n * 3; };

					var one = $api.fp.impure.Input.value(1);

					verify(one()).is(1);

					var tripled = $api.fp.impure.Input.value(1, triple);
					verify(tripled()).is(3);

					var tripledTwice = $api.fp.impure.Input.value(1, triple, triple);
					verify(tripledTwice()).is(9);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Input {
			from: {
				mapping: <P,R>(p: {
					mapping: slime.$api.fp.Mapping<P,R>
					argument: P
				}) => impure.Input<R>

				switch: <R>(cases: slime.$api.fp.impure.Input<slime.$api.fp.Maybe<R>>[]) => slime.$api.fp.impure.Input<slime.$api.fp.Maybe<R>>

				partial: <R>(p: {
					if: impure.Input<slime.$api.fp.Maybe<R>>,
					else: impure.Input<R>
				}) => impure.Input<R>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				const { $api } = fifty.global;

				fifty.tests.exports.impure.Input.from = fifty.test.Parent();

				fifty.tests.exports.impure.Input.from.switch = function() {
					const nothing = $api.fp.Maybe.from.nothing();

					var x = $api.fp.impure.Input.from.switch([
						$api.fp.impure.Input.value(nothing)
					]);

					var y = $api.fp.impure.Input.from.switch([
						$api.fp.impure.Input.value($api.fp.Maybe.from.some(3)),
						$api.fp.impure.Input.value($api.fp.Maybe.from.some(4))
					]);

					var z = $api.fp.impure.Input.from.switch([
						$api.fp.impure.Input.value(nothing),
						$api.fp.impure.Input.value($api.fp.Maybe.from.some(5))
					]);

					var X = x();
					var Y = y();
					var Z = z();

					verify(X).present.is(false);
					verify(Y).present.is(true);
					if (Y.present) verify(Y).value.is(3);
					verify(Z).present.is(true);
					if (Z.present) verify(Z).value.is(5);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Input {

			/**
			 * A function that takes an {@link impure.Input | Input} as an argument and returns a memoized version of that `Input`.
			 *
			 * @param i An `Input` to memoize
			 * @returns A memoized `Input` whose underlying implementation will only be invoked the first time it is invoked;
			 * succeeding invocations will simply return the value returned by the first invocation.
			 */
			memoized: <T>(i: impure.Input<T>) => impure.Input<T>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.exports.impure.Input.memoized = function() {
					var calls: number;

					var counter = function() {
						if (typeof(calls) == "undefined") calls = 0;
						calls++;
						return 42;
					};

					verify(calls).is(void(0));

					var memoized = fifty.global.$api.fp.impure.Input.memoized(counter);

					verify(calls).is(void(0));

					var result = memoized();
					verify(result).is(42);
					verify(calls).is(1);

					var result2 = memoized();
					verify(result2).is(42);
					verify(calls).is(1);

					var result3 = counter();
					verify(result3).is(42);
					verify(calls).is(2);

					fifty.run(function oo() {
						var target = function(): object { return this; };
						var object = {
							target: target,
							memoized: fifty.global.$api.fp.impure.Input.memoized(target)
						};

						verify(object).target().is(object);
						verify(object).memoized().is(object);
					});
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Input {
			map: Thunk_map
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.impure.Input.map = function() {
					var input = function() { return 1; };
					var triple = function(n) { return n*3; };

					var one = $api.fp.impure.Input.map(input, triple);
					verify(one()).is(3);
					var two = $api.fp.impure.Input.map(input, triple, triple);
					verify(two()).is(9);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Input {
			mapping: {
				all: <P,R>(p: slime.$api.fp.impure.Input<R>) => slime.$api.fp.Mapping<P,R>
			}
		}
	}

	export namespace exports {
		export interface Input {
			process: <T>(input: impure.Input<T>, output: impure.Output<T>) => impure.Process
		}
	}

	export namespace exports {
		export interface Input {
			compose: <T>(inputs: {
				[k in keyof T]: slime.$api.fp.impure.Input<T[k]>
			}) => slime.$api.fp.impure.Input<T>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.impure.Input.compose = function() {
					var inputs = {
						n: $api.fp.returning(8),
						s: $api.fp.returning("hello")
					};

					var input = $api.fp.impure.Input.compose(inputs);

					var values = input();
					verify(values).n.is(8);
					verify(values).s.is("hello");
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Input {
			stream: <T>(input: impure.Input<T>) => Stream<T>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.impure.Input.stream = function() {
					var input = function() { return "yes! with me" };
					var stream = $api.fp.impure.Input.stream(input);
					var collected = $api.fp.Stream.collect(stream);
					verify(collected).length.is(1);
					verify(collected)[0].is("yes! with me");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Input {
			supply: <T>(input: impure.Input<T>) => (output: impure.Output<T>) => impure.Process
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.impure.Input.supply = function() {
					var buffer: number[] = [];

					var input = function() { return 2; };
					var sendTwo = $api.fp.impure.Input.supply(input);

					var output = function(n: number) { buffer.push(n); };

					verify(buffer).length.is(0);
					sendTwo(output)();
					sendTwo(output)();
					verify(buffer).length.is(2);
					verify(buffer)[0].is(2);
					verify(buffer)[1].is(2);
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace input {
		export interface Store<T> {
			get: () => Maybe<T>
			set: impure.Effect<T>
		}
	}

	export namespace exports {
		export interface Input {
			cache: <T>(cache: input.Store<T>) => slime.$api.fp.Transform<() => T>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				type Invocation<F extends slime.external.lib.es5.Function> = {
					target: ThisParameterType<F>
					arguments: Parameters<F>
					returned: ReturnType<F>
				};

				fifty.tests.exports.impure.Input.cache = function() {
					//	TODO	add to Fifty proper
					var spy = function<F extends slime.external.lib.es5.Function>(f: F): { invoke: F, recorded: Invocation<F>[] } {
						var recorded: Invocation<F>[] = [];
						return {
							invoke: function() {
								const target: Invocation<F>["target"] = this;
								const args: Invocation<F>["arguments"] = Array.prototype.slice.call(arguments);
								var rv = f.apply(this, arguments);
								recorded.push({ target, arguments: args, returned: rv });
								return rv;
							} as F,
							recorded: recorded
						};
					};

					var cache: Parameters<exports.Input["cache"]>[0] = (
						function<T>() {
							var value: slime.$api.fp.Maybe<T> = $api.fp.Maybe.from.nothing();

							return {
								get: function() {
									return value;
								},
								set: function(v) {
									value = $api.fp.Maybe.from.some(v) as slime.$api.fp.Maybe<T>;
								}
							}
						}
					)();

					var input = function() {
						return 2*2*2;
					};

					var spies = {
						input: spy(input),
						cache: {
							get: spy(cache.get),
							set: spy(cache.set)
						}
					};

					var caching = $api.fp.impure.Input.cache({ get: spies.cache.get.invoke, set: spies.cache.set.invoke })(spies.input.invoke);

					verify(spies).input.recorded.length.is(0);
					verify(spies).cache.get.recorded.length.is(0);
					verify(spies).cache.set.recorded.length.is(0);

					var value = caching();

					verify(value).is(8);
					verify(spies).input.recorded.length.is(1);
					verify(spies).cache.get.recorded.length.is(1);
					verify(spies).cache.set.recorded.length.is(1);

					value = caching();

					verify(value).is(8);
					verify(spies).input.recorded.length.is(1);
					verify(spies).cache.get.recorded.length.is(2);
					verify(spies).cache.set.recorded.length.is(1);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Input: exports.Input
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.impure.Output = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Output {
			nothing: <P>() => impure.Output<P>
		}

		export interface Output {
			process: <P>(p: {
				value: P
				output: impure.Output<P>
			}) => impure.Process
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.exports.impure.Output.process = function() {
					var buffer: number[] = [];

					var output: impure.Output<number> = function(p) {
						buffer.push(p);
					};

					var process = $api.fp.impure.Output.process({
						value: 2,
						output: output
					});

					verify(buffer).length.is(0);

					process();
					process();

					verify(buffer).length.is(2);
					verify(buffer)[0].is(2);
					verify(buffer)[1].is(2);
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Output {
			compose: <P>(elements: impure.Output<P>[]) => impure.Output<P>
		}

		export interface Output {
			map: <P,R>(p: {
				map: slime.$api.fp.Mapping<P,R>
				output: slime.$api.fp.impure.Output<R>
			}) => slime.$api.fp.impure.Output<P>
		}
	}

	export interface Exports {
		Output: exports.Output
	}

	export interface Exports {
		Process: {
			compose: (processes: impure.Process[]) => impure.Process
			output: <P>(p: P, f: impure.Output<P>) => impure.Process

			create: <T>(p: {
				input: Input<T>
				output: Output<T>
			}) => impure.Process

			value: Process_value

			now: (process: impure.Process) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			const subject = $api.fp.impure;

			fifty.tests.exports.Process = fifty.test.Parent();

			fifty.tests.exports.Process.value = function() {
				var saved: string;

				var save: Output<string> = function(v) {
					saved = v;
				};

				var double = function(number): number {
					return number * 2;
				};

				var p = subject.Process.value(
					2,
					double,
					String,
					save
				);

				verify(saved).is(void(0));
				p();
				verify(saved).is("4");
			};

			fifty.tests.exports.Process.create = function() {
				var buffer: number[] = [];

				var input = function() { return 2; };

				var output = function(n: number) { buffer.push(n); };

				verify(buffer).length.is(0);

				var created = $api.fp.impure.Process.create({
					input: input,
					output: output
				})

				created();
				created();

				verify(buffer).length.is(2);
				verify(buffer)[0].is(2);
				verify(buffer)[1].is(2);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		now: {
			input: <T>(input: impure.Input<T>) => T
			output: <P>(p: P, f: impure.Output<P>) => void

			/**
			 * @deprecated Replaced by {@link Exports.Process.now}.
			 */
			process: (process: impure.Process) => void
		}

		tap: <T>(output: Output<T>) => (t: T) => T
	}

	export interface Exports {
		Stream: stream.impure.Exports
	}
}

namespace slime.$api.fp.world {
	export type Sensor<S,E,R> = (s: S) => Question<E,R>
	export type Means<O,E> = (o: O) => Action<E>

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

	export type Question<E,R> = (events: slime.$api.event.Emitter<E>) => R
	export type Action<E> = (events: slime.$api.event.Emitter<E>) => void

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
				var doubler: Sensor<number, { argument: string }, number> = function(p) {
					return function(events) {
						events.fire("argument", String(p));
						return p * 2;
					}
				};

				var captor = fifty.$api.Events.Captor({
					argument: void(0)
				});
				var map = $api.fp.world.mapping(doubler, captor.handler);

				verify(captor).events.length.is(0);
				verify(2).evaluate(map).is(4);
				verify(captor).events.length.is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Sensor: {
			from: {
				flat: <S,E,R>(f: (p: { subject: S, events: slime.$api.event.Emitter<E> }) => R) => Sensor<S,E,R>
			}

			map: <NS,S,E,R,NR>(p: {
				subject: slime.$api.fp.Mapping<NS,S>
				sensor?: slime.$api.fp.world.Sensor<S,E,R>
				reading?: slime.$api.fp.Mapping<R,NR>
			}) => slime.$api.fp.world.Sensor<NS,E,NR>

			mapping: <S,E,R>(p: {
				sensor: slime.$api.fp.world.Sensor<S,E,R>
				handlers?: slime.$api.event.Handlers<E>
			}) => slime.$api.fp.Mapping<S,R>

			input: <S,E,R>(p: {
				sensor: slime.$api.fp.world.Sensor<S,E,R>
				subject: S
				handlers?: slime.$api.event.Handlers<E>
			}) => slime.$api.fp.impure.Input<R>

			now: <S,E,R>(p: {
				sensor: slime.$api.fp.world.Sensor<S,E,R>
				subject: S
				handlers?: slime.$api.event.Handlers<E>
			}) => R
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

				var doubler: Sensor<number,{ got: number, returning: number },number> = function(s) {
					return function(events) {
						events.fire("got", s);
						var rv = s * 2;
						events.fire("returning", rv);
						return rv;
					}
				};

				var mapping = $api.fp.world.Sensor.mapping({
					sensor: doubler,
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

	export interface Exports {
		Means: {
			from: {
				flat: <O,E>(f: (p: { order: O, events: slime.$api.event.Emitter<E> }) => void) => Means<O,E>
			}

			map: <P,R,E>(p: {
				order: slime.$api.fp.Mapping<P,R>
				means: slime.$api.fp.world.Means<R,E>
			}) => slime.$api.fp.world.Means<P,E>

			output: <O,E>(p: {
				means: slime.$api.fp.world.Means<O,E>
				handlers?: slime.$api.event.Handlers<E>
			}) => impure.Output<O>

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

			order: {
				process: <O,E>(p: {
					means: slime.$api.fp.world.Means<O,E>
					order: slime.$api.fp.Thunk<O>
					handlers?: slime.$api.event.Handlers<E>
				}) => slime.$api.fp.impure.Process
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			var NumberRecorder = function() {
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

			var castToNumber: slime.js.Cast<number> = $api.fp.cast.unsafe;

			fifty.tests.exports.world.Means = fifty.test.Parent();
			fifty.tests.exports.world.Means.map = function() {
				var { orders, captor, recorder } = NumberRecorder();

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
				verify(captor).events[0].detail.evaluate(castToNumber).is(4);
				verify(captor).events[1].type.is("length");
				verify(captor).events[1].detail.evaluate(castToNumber).is(1);
			};

			fifty.tests.exports.world.Means.output = function() {
				var { orders, captor, recorder } = NumberRecorder();

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
				verify(captor).events[0].detail.evaluate(castToNumber).is(2);
				verify(captor).events[1].type.is("length");
				verify(captor).events[1].detail.evaluate(castToNumber).is(1);
			}

			fifty.tests.exports.world.Means.process = function() {
				var { orders, captor, recorder } = NumberRecorder();

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
				verify(captor).events[0].detail.evaluate(castToNumber).is(2);
				verify(captor).events[1].type.is("length");
				verify(captor).events[1].detail.evaluate(castToNumber).is(1);
			};

			fifty.tests.exports.world.Means.now = function() {
				var { orders, captor, recorder } = NumberRecorder();

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
				verify(captor).events[0].detail.evaluate(castToNumber).is(2);
				verify(captor).events[1].type.is("length");
				verify(captor).events[1].detail.evaluate(castToNumber).is(1);
			};
		}
	//@ts-ignore
	)(fifty);

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

	export namespace exports {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.world.Question = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface Question {
			now: <E,A>(p: {
				question: world.Question<E,A>
				handlers?: slime.$api.event.Handlers<E>
			}) => A
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

		Question: exports.Question & {
			/**
			 * An operation equivalent to {@link Exports | pipe(argument, question)}, but limited to one argument which provides
			 * more readable type inference, mapping the produced value to a `Sensor` rather than a function returning a `Question`.
			 */
			pipe: <I,P,E,A>(argument: (i: I) => P, question: world.Sensor<P,E,A>) => world.Sensor<I,E,A>
			map: <P,E,A,O>(question: world.Sensor<P,E,A>, map: (a: A) => O) => world.Sensor<P,E,O>
			wrap: <I,P,E,A,O>(argument: (i: I) => P, question: world.Sensor<P,E,A>, map: (a: A) => O) => world.Sensor<I,E,O>
		}

		Action: {
			output: <P,E>(handler?: slime.$api.event.Handlers<E>) => (action: slime.$api.fp.world.Means<P,E>) => slime.$api.fp.impure.Output<P>

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

			process: <E>(p: {
				action: slime.$api.fp.world.Action<E>
				handlers?: slime.$api.event.Handlers<E>
			}) => slime.$api.fp.impure.Process

			now: <E>(p: {
				action: slime.$api.fp.world.Action<E>
				handlers?: slime.$api.event.Handlers<E>
			}) => void
		}

		Ask: {
			input: <E,T>(handler?: slime.$api.event.Handlers<E>) => (ask: slime.$api.fp.world.Question<E,T>) => slime.$api.fp.impure.Input<T>
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
			question: <P,E,A>(question: world.Sensor<P,E,A>, argument: P, handler?: slime.$api.event.Handlers<E>) => A

			/**
			 * @deprecated Replaced by Means.now()
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

namespace slime.$api.fp.internal.impure {
	export interface Context {
		Maybe: slime.$api.fp.Exports["Maybe"]
		pipe: slime.$api.fp.Pipe
		stream: slime.$api.fp.stream.impure.Exports
		events: slime.runtime.internal.events.Exports
	}

	export interface Exports {
		impure: slime.$api.fp.impure.Exports
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

	export type Script = slime.loader.Script<Context,Exports>
}
