//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp {
	export type Pipe = {
		<A,B,C,D,E,F,G,H,I>(
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H,
			m: (h: H) => I
		): (a: A) => I

		<A,B,C,D,E,F,G,H>(
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H
		): (a: A) => H

		<A,B,C,D,E,F,G>(
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G
		): (a: A) => G

		<A,B,C,D,E,F>(
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F
		): (a: A) => F

		<A,B,C,D,E>(
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E
		): (a: A) => E

		<A,B,C,D>(
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D
		): (a: A) => D

		<A,B,C>(
			f: (a: A) => B,
			g: (b: B) => C
		): (a: A) => C

		<A,B>(
			f: (a: A) => B
		): (a: A) => B
	}

	export type Now_map = {
		<A,B,C,D,E,F,G,H,I>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H,
			m: (h: H) => I
		): I

		<A,B,C,D,E,F,G,H>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H
		): H

		<A,B,C,D,E,F,G>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G
		): G

		<A,B,C,D,E,F>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F
		): F

		<A,B,C,D,E>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E
		): E

		<A,B,C,D>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D
		): D

		<A,B,C>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C
		): C

		<A,B>(
			a: A,
			f: (a: A) => B
		): B
	}

	export type Thunk_now = {
		<A,B,C,D,E,F,G,H,I>(
			a: Thunk<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H,
			m: (h: H) => I
		): I

		<A,B,C,D,E,F,G,H>(
			a: Thunk<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H
		): H

		<A,B,C,D,E,F,G>(
			a: Thunk<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G
		): G

		<A,B,C,D,E,F>(
			a: Thunk<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F
		): F

		<A,B,C,D,E>(
			a: Thunk<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E
		): E

		<A,B,C,D>(
			a: Thunk<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D
		): D

		<A,B,C>(
			a: Thunk<A>,
			f: (a: A) => B,
			g: (b: B) => C
		): C

		<A,B>(
			a: Thunk<A>,
			f: (a: A) => B
		): B
	}

	export type Thunk_value = {
		<A,B,C,D,E,F,G,H,I>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H,
			m: (h: H) => I
		): Thunk<I>

		<A,B,C,D,E,F,G,H>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H
		): Thunk<H>

		<A,B,C,D,E,F,G>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G
		): Thunk<G>

		<A,B,C,D,E,F>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F
		): Thunk<F>

		<A,B,C,D,E>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E
		): Thunk<E>

		<A,B,C,D>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D
		): Thunk<D>

		<A,B,C>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C
		): Thunk<C>

		<A,B>(
			a: A,
			f: (a: A) => B
		): Thunk<B>

		<A>(
			a: A
		): Thunk<A>
	}
}

namespace slime.$api.fp.impure {
	export type Input_map = {
		<A,B,C,D,E,F,G,H,I>(
			a: Input<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H,
			m: (h: H) => I
		): Input<I>

		<A,B,C,D,E,F,G,H>(
			a: Input<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H
		): Input<H>

		<A,B,C,D,E,F,G>(
			a: Input<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G
		): Input<G>

		<A,B,C,D,E,F>(
			a: Input<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F
		): Input<F>

		<A,B,C,D,E>(
			a: Input<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E
		): Input<E>

		<A,B,C,D>(
			a: Input<A>,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D
		): Input<D>

		<A,B,C>(
			a: Input<A>,
			f: (a: A) => B,
			g: (b: B) => C
		): Input<C>

		<A,B>(
			a: Input<A>,
			f: (a: A) => B
		): Input<B>
	}

	export type Input_value = {
		<A,B,C,D,E,F,G,H,I>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H,
			m: (h: H) => I
		): Input<I>

		<A,B,C,D,E,F,G,H>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H
		): Input<H>

		<A,B,C,D,E,F,G>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G
		): Input<G>

		<A,B,C,D,E,F>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F
		): Input<F>

		<A,B,C,D,E>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E
		): Input<E>

		<A,B,C,D>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D
		): Input<D>

		<A,B,C>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C
		): Input<C>

		<A,B>(
			a: A,
			f: (a: A) => B
		): Input<B>

		<A>(
			a: A
		): Input<A>
	}

	export type Process_value = {
		<A,B,C,D,E,F,G,H>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: (g: G) => H,
			m: Output<H>
		): Process

		<A,B,C,D,E,F,G>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: (f: F) => G,
			l: Output<G>
		): Process

		<A,B,C,D,E,F>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: (e: E) => F,
			k: Output<F>
		): Process

		<A,B,C,D,E>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: (d: D) => E,
			j: Output<E>
		): Process

		<A,B,C,D>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: (c: C) => D,
			i: Output<D>
		): Process

		<A,B,C>(
			a: A,
			f: (a: A) => B,
			g: (b: B) => C,
			h: Output<C>
		): Process

		<A,B>(
			a: A,
			f: (a: A) => B,
			g: Output<B>
		): Process

		<A>(
			a: A,
			f: Output<A>
		): Process
	}
}
