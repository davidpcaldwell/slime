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
	export type Input<T> = () => T
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

				switch: <R>(p: {
					cases: slime.$api.fp.impure.Input<slime.$api.fp.Maybe<R>>[],
					default: slime.$api.fp.impure.Input<R>
				}) => slime.$api.fp.impure.Input<R>
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

					var x = $api.fp.impure.Input.from.switch({
						cases: [
							$api.fp.impure.Input.value(nothing)
						],
						default: $api.fp.impure.Input.value(4)
					});

					var y = $api.fp.impure.Input.from.switch({
						cases: [
							$api.fp.impure.Input.value($api.fp.Maybe.from.some(3))
						],
						default: $api.fp.impure.Input.value(4)
					});

					verify(x()).is(4);
					verify(y()).is(3);
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
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Input {
			map: impure.Input_map
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

	export interface Exports {
		Input: exports.Input
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
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		now: {
			input: <T>(input: impure.Input<T>) => T
			output: <P>(p: P, f: impure.Output<P>) => void
			process: (process: impure.Process) => void
		}

		tap: <T>(output: Output<T>) => (t: T) => T
	}
}

namespace slime.$api.fp.world {
	export type Question<P,E,A> = (p?: P) => Ask<E,A>
	export type Action<P,E> = (p?: P) => Tell<E>

	export type Ask<E,T> = (events: slime.$api.Events<E>) => T
	export type Tell<E> = (events: slime.$api.Events<E>) => void

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
		mapping: <P,E,A>(question: world.Question<P,E,A>, handler?: slime.$api.event.Handlers<E>) => fp.Mapping<P,A>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.world.question = function() {
				var doubler: Question<number, { argument: string }, number> = function(p) {
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
		output: <P,E>(action: world.Action<P,E>, handler?: slime.$api.event.Handlers<E>) => impure.Output<P>

		process: <E>(tell: world.Tell<E>, handler?: slime.$api.event.Handlers<E>) => impure.Process

		input: <E,A>(ask: world.Ask<E,A>, handler?: slime.$api.event.Handlers<E>) => impure.Input<A>

		Question: {
			/**
			 * An operation equivalent to {@link Exports | pipe(argument, question)}, but limited to one argument which provides
			 * more readable type inference, mapping the produced value to a `Question` rather than a function returning an `Ask`.
			 */
			pipe: <I,P,E,A>(argument: (i: I) => P, question: world.Question<P,E,A>) => world.Question<I,E,A>
			map: <P,E,A,O>(question: world.Question<P,E,A>, map: (a: A) => O) => world.Question<P,E,O>
			wrap: <I,P,E,A,O>(argument: (i: I) => P, question: world.Question<P,E,A>, map: (a: A) => O) => world.Question<I,E,O>
		}
	}

	export interface Exports {
		now: {
			question: <P,E,A>(question: world.Question<P,E,A>, argument: P, handler?: slime.$api.event.Handlers<E>) => A
			action: <P,E>(action: world.Action<P,E>, argument?: P, handler?: slime.$api.event.Handlers<E>) => void

			ask: <E,A>(ask: world.Ask<E,A>, handler?: slime.$api.event.Handlers<E>) => A
			tell: <E>(tell: world.Tell<E>, handler?: slime.$api.event.Handlers<E>) => void
		}

		/** @deprecated Used almost entirely for `jsh.shell.tools.node.require`. After refactoring that, reassess. */
		execute: <E>(tell: world.Tell<E>, handler?: slime.$api.event.Handlers<E>) => void

		/** @deprecated */
		old: {
			/** @deprecated */
			ask: <E,T>(f: (events: slime.$api.Events<E>) => T) => world.old.Ask<E,T>
			/** @deprecated */
			tell: <E>(f: (events: slime.$api.Events<E>) => void) => world.old.Tell<E>
		}
	}
}

namespace slime.$api.fp.internal.impure {
	export interface Context {
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

			fifty.tests.wip = fifty.tests.suite;
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
