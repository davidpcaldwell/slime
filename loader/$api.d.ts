interface Function {
	construct: any
}

type Iterable_match<L,R> = {
	left: L,
	right: R
}

interface $api {
	debug: {
		disableBreakOnExceptionsFor: <T extends Function>(f: T) => T
	}
	Object: {
		(p: any): any
		compose: {
			<T>(t: T): T
			<T,U>(t: T, u: U): T & U
			<T,U,V>(t: T, u: U, v: V): T & U & V
			<T,U,V,W>(t: T, u: U, v: V, w: W): T & U & V & W
		}
		properties: Function
	},
	Value: any,
	Events: {
		(p: any): $api.Events,
		//	TODO	could probably use parameterized types to improve accuracy
		Function: <P,R>(f: (p: P, events: any) => R, defaultListeners?: object) => (argument: P, receiver?: $api.Events.Function.Receiver) => R
	},
	Iterable: {
		/**
		 * Collates an iterable set of values of type V (extends any) into groups of type G (extends any) (or counts the number of
		 * values in each group) based on a specified set of criteria.
		 *
		 * @param p
		 */
		groupBy<V,G> (p: {
			array: Array<V>,
			group: (element: V) => G,
			groups?: Array<G>,
			codec?: {
				encode: (group: G) => string,
				decode: (string: string) => G
			},
			count?: boolean
		}) : {
			array: () => Array<{
				group: G
				array?: V[],
				count?: number
			}>
		},

		match<L,R> (
			p: {
				left: L[],
				right: R[],
				matches: (l: L, r: R) => boolean,
				unmatched: {
					left: (l: L) => void,
					right: (r: R) => void
				},
				matched: (l: L, r: R) => void
			}
		): {
			unmatched: {
				left: L[],
				right: R[]
			},
			matched: Iterable_match<L,R>[]
		}
	},
	deprecate: {
		(o: object, property: string): void
		<T extends Function>(f: T): T
	}
	experimental: (a: any, b: any) => any
}

declare namespace $api {
	const debug: $api["debug"];
	const Iterable: $api["Iterable"];
	const Events : $api["Events"];
	const Value: $api["Value"]

	interface Event {
		type: string
		source: object
		timestamp: number
		detail: any
	}

	interface Events {
		listeners: any,
		fire: (type: string, detail: any) => void
	}

	namespace Events.Function {
		type Receiver = { [x: string]: (e: Event) => void } | $api.Events
	}

	const deprecate: $api["deprecate"];
	const experimental: $api["experimental"];

	interface Function {
		identity: <T>(t: T) => T
		returning: <T>(t: T) => () => T
		Array: {
			filter: <T>(f: (t: T) => boolean) => (ts: T[]) => T[]
			find: <T>(f: (t: T) => boolean) => (ts: T[]) => T | undefined
			map: any
		}
		safeNavigate<T,K>(k: keyof T): (t: T) => T[k]
		memoized: <T>(f: () => T) => () => T
		pipe: {
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

	const Function: Function;
	const Object: $api["Object"];
}