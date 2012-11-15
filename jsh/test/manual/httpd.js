$exports.handle = function(request) {
	return {
		status: {
			code: 200
		},
		headers: [],
		body: {
			type: "text/plain",
			string: "Hello, World!"
		}
	};
}