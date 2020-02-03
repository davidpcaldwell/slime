type Iterable_match<L,R> = {
	left: L,
	right: R
}

interface $api {
	Events: {
		(p: any): {
			listeners: any,
			fire: (type: string, detail: any) => void
		},
		//	TODO	could probably use parameterized types to improve accuracy
		Function: (f: (p: any, events: any) => any, defaultListeners?: object) => (argument: any, receiver: $api.Events | object) => any
	},
	Iterable: {
		/**
		 * Collates an iterable set of values of type V (extends any) into groups of type G (extends any) (or counts the number of
		 * values in each group) based on a specified set of criteria.
		 *
		 * @param p
		 */
		groupBy: (p: {
			array: Array<any>,
			group: (element: any) => any,
			groups?: Array<any>,
			codec?: {
				encode: (group: any) => string,
				decode: (string: string) => any
			},
			count: boolean
		}) => any,

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
	deprecate: (a: any) => any,
	experimental: (a: any, b: any) => any
}

declare namespace $api {
	const Iterable: $api["Iterable"];
	const Events : $api["Events"];
	const deprecate: $api["deprecate"];
	const experimental: $api["experimental"];

	const Function: any;
	const Object: any;
}