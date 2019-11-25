declare namespace $api {
	namespace Iterable {
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