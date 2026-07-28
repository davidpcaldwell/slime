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
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.$api.fp.impure {
	/**
	 * Represents a read-only, non-thread-safe value internal to the running program. The value may change over time due to
	 * internal mutation, but cannot be modified through this interface.
	 */
	export interface Value<T> {
		get: () => T
	}

	/**
	 * Represents a mutable, non-thread-safe value internal to the running program. After calling `set`, `get` should return the
	 * value just set under all circumstances.
	 */
	export interface Variable<T> {
		get: () => T
		set: (t: T) => void
	}

	/**
	 * Represents a value external to the running program's environment that can be retrieved by an invocation. This value may be
	 * mutated over time by external processes; examples might include the current time, the CPU load on the system, or some
	 * remotely readable value from a shared filesystem or database.
	 */
	export interface Reading<T> {
		read: () => T
	}

	/** @deprecated Replaced by `Reading` (for external operations) and `Thunk` (for non-external operations). */
	export type Input<T> = () => T

	/**
	 * A function capable of observing some kind of external state and obtaining and returning it to the caller.
	 *
	 * @deprecated Replaced by {@link Reading}. Note that `Reading` is not a drop-in replacement, but requires a `read` method
	 * instead of the function signature provided by `External`.
	 */
	export type External<T> = () => T

	/**
	 * Represents a mutable value external to the running program.
	 */
	export interface Persistent<T> {
		read: () => T
		write: (t: T) => void
	}

	/**
	 * An impure function, with potential side effects, that is capable of effecting some kind of external outcome. Its argument
	 * describes a command which specifies the desired effect.
	 */
	export type Effector<C> = (command: C) => void

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
			 * @deprecated Replaced by {@link slime.$api.fp.Exports["Thunk"]["memoize"] }
			 *
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
			set: impure.Effector<T>
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

				type Invocation<F extends slime.external.lib.es5.Function<any,any,any>> = (
					F extends slime.external.lib.es5.Function<
						infer T,
						infer P,
						infer R
					> ? {
						target: T
						arguments: P
						returned: R
						// target: ThisParameterType<F>
						// arguments: Parameters<F>
						// returned: ReturnType<F>
					} : never
				);

				fifty.tests.exports.impure.Input.cache = function() {
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
						input: fifty.spy.create(input),
						cache: {
							get: fifty.spy.create(cache.get),
							set: fifty.spy.create(cache.set)
						}
					};

					var caching = $api.fp.impure.Input.cache({ get: spies.cache.get.function, set: spies.cache.set.function })(spies.input.function);

					verify(spies).input.invocations.length.is(0);
					verify(spies).cache.get.invocations.length.is(0);
					verify(spies).cache.set.invocations.length.is(0);

					var value = caching();

					verify(value).is(8);
					verify(spies).input.invocations.length.is(1);
					verify(spies).cache.get.invocations.length.is(1);
					verify(spies).cache.set.invocations.length.is(1);

					value = caching();

					verify(value).is(8);
					verify(spies).input.invocations.length.is(1);
					verify(spies).cache.get.invocations.length.is(2);
					verify(spies).cache.set.invocations.length.is(1);
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

	export interface Exports {
		Effector: effector.Exports
	}

	export namespace effector {
		export interface Exports {
			invoke: <C>(p: { effector: Effector<C>, command: C }) => void
		}

		export interface Exports {
			process: <P>(p: P) => (f: Effector<P>) => Process
			now: <P>(p: P) => (f: Effector<P>) => void
		}
	}

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

namespace slime.$api.fp.internal.impure {
	export interface Context {
		Maybe: slime.$api.fp.Exports["Maybe"]
		stream: slime.$api.fp.stream.impure.Exports
	}

	export interface Exports {
		impure: slime.$api.fp.impure.Exports
		// world: slime.$api.fp.world.Exports
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
