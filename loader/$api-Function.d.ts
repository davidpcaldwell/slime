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
		impure: {
			revise: <T,P>(f: (this: T, p: P) => (P | void)) => impure.Reviser<P>
		}
		[name: string]: amy
	}

	namespace Function {
		namespace impure {
			type Reviser<P> = (p: P) => P
		}
	}
}