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
}

namespace slime.$api.fp.impure {
	export type Input<T> = () => T
	export type Output<T> = (t: T) => void
	export type Process = () => void

	export interface Exports {
		now: {
			input: <T>(input: impure.Input<T>) => T
			output: <P>(p: P, f: impure.Output<P>) => void
			process: (process: impure.Process) => void
		}

		Input: {
			value: <T>(t: T) => impure.Input<T>
			map: <I,T>(input: impure.Input<I>, map: (i: I) => T) => impure.Input<T>
		}

		Process: {
			compose: (processes: impure.Process[]) => impure.Process
			output: <P>(p: P, f: impure.Output<P>) => impure.Process
		}
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
		export type Ask<E,T> = (on?: slime.$api.events.Handler<E>) => T

		/** @deprecated */
		export type Tell<E> = (on?: slime.$api.events.Handler<E>) => void

		/** @deprecated */
		export type Action<P,E> = (p?: P) => Tell<E>

		/** @deprecated Identical to {@link Ask} but has slightly different semantics (analogous to HTTP POST). */
		export type Operation<E,R> = (on?: slime.$api.events.Handler<E>) => R
	}

	export interface Exports {
		question: <P,E,A>(question: world.Question<P,E,A>, handler?: slime.$api.events.Handler<E>) => (p: P) => A
		action: <P,E>(action: world.Action<P,E>, handler?: slime.$api.events.Handler<E>) => impure.Output<P>

		Question: {
			/**
			 * An operation equivalent to {@link Exports | pipe(argument, question)}, but limited to one argument which provides
			 * more readable type inference, mapping the produced value to a `Question` rather than a function returning an `Ask`.
			 */
			pipe: <I,P,E,A>(argument: (i: I) => P, question: world.Question<P,E,A>) => world.Question<I,E,A>
			map: <P,E,A,O>(question: world.Question<P,E,A>, map: (a: A) => O) => world.Question<P,E,O>
			wrap: <I,P,E,A,O>(argument: (i: I) => P, question: world.Question<P,E,A>, map: (a: A) => O) => world.Question<I,E,O>
		}

		ask: <E,A>(ask: world.Ask<E,A>, handler?: slime.$api.events.Handler<E>) => impure.Input<A>
		tell: <E>(tell: world.Tell<E>, handler?: slime.$api.events.Handler<E>) => impure.Process

		now: {
			question: <P,E,A>(question: world.Question<P,E,A>, argument?: P, handler?: slime.$api.events.Handler<E>) => A
			action: <P,E>(action: world.Action<P,E>, argument?: P, handler?: slime.$api.events.Handler<E>) => void
		}

		/** @deprecated Used almost entirely for `jsh.shwll.tools.node.require`. After refactoring that, reassess. */
		execute: <E>(tell: world.Tell<E>, handler?: slime.$api.events.Handler<E>) => void

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

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
