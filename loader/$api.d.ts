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
				groups: Array<any>,
				codec: {
					encode: (group: any) => string,
					decode: (string: string) => any
				},
				count: boolean
			}
		)
	}
}