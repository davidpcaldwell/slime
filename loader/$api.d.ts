interface $api {
	Events: {
		(p: any): {
			listeners: any,
			fire: (type: string, detail: any) => void
		},
		//	TODO	could probably use parameterized types to improve accuracy
		Function: (f: (p: any) => any, defaultListeners: object) => (argument: any, receiver: $api.Events | object) => any
	}
}

declare namespace $api {
	namespace Iterable {
		/**
		 * Collates an iterable set of values of type V (extends any) into groups of type G (extends any) (or counts the number of
		 * values in each group) based on a specified set of criteria.
		 *
		 * @param p
		 */
		function groupBy(
			p: {
				array: Array<any>,
				group: (element: any) => any,
				groups?: Array<any>,
				codec?: {
					encode: (group: any) => string,
					decode: (string: string) => any
				},
				count: boolean
			}
		);


		//	TODO	investigate whether match can be defined with parameterized types

		interface match {
			left: any,
			right: any
		}

		function match(
			p: {
				left: any[],
				right: any[],
				matches: (l: any, r: any) => boolean,
				unmatched: {
					left: (l: any) => void,
					right: (r: any) => void
				},
				matched: (l: any, r: any) => void
			}
		) : {
			unmatched: {
				left: any[],
				right: any[]
			},
			matched: match[]
		}
	}

	const Events : $api["Events"];

	function deprecate(a: any): any
}