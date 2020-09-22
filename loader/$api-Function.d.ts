interface $api {
	Function: $api.Function
}

namespace $api {
	interface Function {
		identity: <T>(t: T) => T
		returning: <T>(t: T) => () => T
		Array: {
			filter: <T>(f: (t: T) => boolean) => (ts: T[]) => T[]
			find: <T>(f: (t: T) => boolean) => (ts: T[]) => T | undefined
			map: any,
			groupBy: <V,G>(c: {
				group: (element: V) => G,
				groups?: G[],
				codec?: { encode: (group: G) => string, decode: (string: string) => G },
			}) => (p: V[]) => { group: G, array: V[] }[]
			join: (s: string) => (elements: any[]) => string
		}
		Boolean: {
			map: <T>(p: { true: T, false: T }) => (b: boolean) => T
		}
		optionalChain<T,K>(k: keyof T): (t: T) => T[k]
		memoized: <T>(f: () => T) => () => T
		pipe: {
			<T,U,V,W,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => R
			): (t: T) => R
			<T,U,V,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => R
			): (t: T) => R
			<T,U,R>(
				f: (t: T) => U,
				g: (u: U) => R
			): (t: T) => R
			<T,R>(f: (t: T) => R): (t: T) => R
		}
		result: {
			<P,T,U,V,W,X,Y,Z,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => X,
				k: (x: x) => Y,
				l: (y: Y) => Z,
				m: (z: Z) => R
			): R
			<P,T,U,V,W,X,Y,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => X,
				k: (x: x) => Y,
				l: (y: Y) => R
			): R
			<P,T,U,V,W,X,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => X,
				k: (x: x) => R
			): R
			<P,T,U,V,W,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => W,
				j: (w: W) => R
			): R
			<P,T,U,V,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => V,
				i: (v: V) => R
			): R
			<P,T,U,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => U,
				h: (u: U) => R
			): R
			<P,T,R>(
				p: P,
				f: (p: P) => T,
				g: (t: T) => R
			): R
			<P,R>(
				p: P,
				f: (i: P) => R
			): R
		}
		Object: {
			entries: {
				(p: {}): [string, any][]
			}
			fromEntries: {
				(p: [string, any][]): { [x: string]: any }
			}
		}
		conditional: {
			<T,R>(p: { condition: (t: T) => boolean, true: (t: T) => R, false: (t: T) => R }): (t: T) => R
			(test: any, yes: any, no: any): any
		}
		[name: string]: any
	}

	interface Function {
		impure: {
			/**
			 * Converts an Updater to a function that can be used in a function pipeline; in other words, if it is an updater
			 * that modifies its argument in place, it will be augmented to return the argument.
			 */
			revise: <T,P>(f: (this: T, p: P) => (P | void)) => impure.Updater<P>

			/**
			 * Creates an Updater that runs the given updaters in a pipeline, allowing the Updaters to replace the pipeline input
			 * by returning a value.
			 */
			compose: {
				<P>(f1: Updater<P>, f2: Updater<P>, f3: Updater<P>, f4: Updater<P>, f5: Updater<P>): Updater<P>
				<P>(f1: Updater<P>, f2: Updater<P>, f3: Updater<P>, f4: Updater<P>): Updater<P>
				<P>(f1: Updater<P>, f2: Updater<P>, f3: Updater<P>): Updater<P>
				<P>(f1: Updater<P>, f2: Updater<P>): Updater<P>
				<P>(f: Updater<P>): Updater<P>
			}
		}
	}

	namespace Function {
		namespace impure {
			/**
			 * An Updater is a function that takes an argument and either (potentially) modifies the argument, returning undefined,
			 * or returns a completely new value to replace the argument.
			 */
			type Updater<P> = (p: P) => P
		}
	}

	interface Function {
		filter: {
			or: {
				<T>(f1: Filter<T>, f2: Filter<T>, f3: Filter<T>, f4: Filter<T>, f5: Filter<T>): Filter<T>
				<T>(f1: Filter<T>, f2: Filter<T>, f3: Filter<T>, f4: Filter<T>): Filter<T>
				<T>(f1: Filter<T>, f2: Filter<T>, f3: Filter<T>): Filter<T>
				<T>(f1: Filter<T>, f2: Filter<T>): Filter<T>
			}
			and: {
				<T>(f1: Filter<T>, f2: Filter<T>, f3: Filter<T>, f4: Filter<T>, f5: Filter<T>): Filter<T>
				<T>(f1: Filter<T>, f2: Filter<T>, f3: Filter<T>, f4: Filter<T>): Filter<T>
				<T>(f1: Filter<T>, f2: Filter<T>, f3: Filter<T>): Filter<T>
				<T>(f1: Filter<T>, f2: Filter<T>): Filter<T>
			}
		}
	}

	namespace Function {
		type Filter<T> = (t: T) => boolean
	}

	interface Function {
		comparator: {
			/**
			 * Creates a comparator given a mapping (which represents some aspect of an underlying type) and a comparator that
			 * compares the mapped values.
			 */
			create: <T,M>(mapping: (t: T) => M, comparator: Function.Comparator<M>) => Function.Comparator<T>

			/**
			 * A comparator that uses the < and > operators to compare its arguments.
			 */
			operators: Function.Comparator<any>,

			/**
			 * Creates a comparator that represents the opposite of the given comparator.
			 */
			reverse: (comparator: Function.Comparator<T>) => Function.Comarator<T>

			/**
			 * Creates a comparator that applies the given comparators in order, using succeeding comparators if a comparator
			 * indicates two values are equal.
			 */
			compose: {
				<T>(c1: Comparator<T>, c2: Comparator<T>, c3: Comparator<T>, c4: Comparator<T>, c5: Comparator<T>): Comparator<T>
				<T>(c1: Comparator<T>, c2: Comparator<T>, c3: Comparator<T>, c4: Comparator<T>): Comparator<T>
				<T>(c1: Comparator<T>, c2: Comparator<T>, c3: Comparator<T>): Comparator<T>
				<T>(c1: Comparator<T>, c2: Comparator<T>): Comparator<T>
			}
		}
	}

	namespace Function {
		type Comparator<T> = (t1: T, t2: T) => number
	}
}