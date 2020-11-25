interface $api {
	Function: $api.Function
}

namespace $api {
	namespace Function {
		type Predicate<T> = (t: T) => boolean
		/** @deprecated */
		type Filter<T> = (t: T) => boolean
	}

	interface Function {
		identity: <T>(t: T) => T
		returning: <T>(t: T) => () => T
		is: <T>(value: T) => (t: T) => boolean
		property: <T,K extends keyof T>(name: K) => (t: T) => T[K]
		Array: {
			filter: <T>(f: Predicate<T>) => (ts: T[]) => T[]
			find: <T>(f: Predicate<T>) => (ts: T[]) => T | undefined
			map: any
			join: (s: string) => (elements: any[]) => string

			groupBy: <V,G>(c: {
				group: (element: V) => G,
				groups?: G[],
				codec?: { encode: (group: G) => string, decode: (string: string) => G },
			}) => (p: V[]) => { group: G, array: V[] }[]

			sum: <T>(attribute: (T) => number) => (array: T[]) => number
		}
		Boolean: {
			map: <T>(p: { true: T, false: T }) => (b: boolean) => T
		}
		optionalChain<T,K>(k: keyof T): (t: T) => T[k]
		memoized: <T>(f: () => T) => () => T
		pipe: {
			<T,U,V,W,X,Y,Z,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => X,
				j: (x: X) => Y,
				k: (y: Y) => Z,
				l: (z: Z) => R
			): (t: T) => R
			<T,U,V,W,X,Y,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => X,
				j: (x: X) => Y,
				k: (y: Y) => R
			): (t: T) => R
			<T,U,V,W,X,R>(
				f: (t: T) => U,
				g: (u: U) => V,
				h: (v: V) => W,
				i: (w: W) => X,
				j: (x: X) => R
			): (t: T) => R
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
			not: <T>(f: Filter<T>) => Filter<T>
		},
		Predicate: {
			is: <T>(value: T) => Predicate<T>
		}
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
			reverse: <T>(comparator: Function.Comparator<T>) => Function.Comarator<T>

			/**
			 * Creates a comparator that applies the given comparators in order, using succeeding comparators if a comparator
			 * indicates two values are equal.
			 */
			compose: {
				<TXY>(c1: Comparator<TXY>, c2: Comparator<TXY>, c3: Comparator<TXY>, c4: Comparator<TXY>, c5: Comparator<TXY>): Comparator<TXY>
				<TXY>(c1: Comparator<TXY>, c2: Comparator<TXY>, c3: Comparator<TXY>, c4: Comparator<TXY>): Comparator<TXY>
				<TXY>(c1: Comparator<TXY>, c2: Comparator<TXY>, c3: Comparator<TXY>): Comparator<TXY>
				<TXY>(c1: Comparator<TXY>, c2: Comparator<TXY>): Comparator<TXY>
			}
		}
	}

	namespace Function {
		type Comparator<T> = (t1: T, t2: T) => number
	}
}