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
		Object: {
			entries: {
				(p: {}): [string, any][]
			}
			fromEntries: {
				(p: [string, any][]): { [x: string]: any }
			}
		}
		[name: string]: amy
	}
}