declare namespace $api {
	namespace Iterable {
		function groupBy(
			p: {
				array: Array<any>,
				group: function,
				groups: Array<any>,
				codec: {
					encode: function,
					decode: function
				},
				count: boolean
			}
		)
	}
}