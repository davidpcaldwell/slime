$exports.handle = function(request) {
	debugger;
	var resource = httpd.loader.resource(request.path);
	if (resource) {
		return {
			status: {
				code: 200
			},
			headers: [],
			body: {
				type: null,
				stream: resource
			}
		}
	} else {
		return {
			status: {
				code: 404
			},
			headers: []
		}
	}
};
