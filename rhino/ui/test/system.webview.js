$exports.handle = function(request) {
	if (request.path == "") {
		var code = $loader.resource("system.html").read(String);
		return {
			status: {
				code: 200
			},
			body: {
				type: "text/html",
				string: $loader.resource("system.html").read(String)
			}
		};
	}
}