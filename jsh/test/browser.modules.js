$exports.handle = function(request) {
	var resource = httpd.loader.resource(request.path);
	jsh.shell.echo(request.path + " = " + resource);
	if (resource) {
		var type;
		//	TODO	wire this into servlet container MIME type specification
		if (false) {

		} else if (/\.html$/.test(request.path)) {
			type = "text/html";
		} else if (/\.js$/.test(request.path)) {
			//	TODO	check for correctness
			type = "application/javascript";
		} else if (/\.coffee$/.test(request.path)) {
			//	TODO	check for correctness
			type = "text/coffeescript";
		} else {
			throw new Error("Unknown type: " + request.path);
		}
		return {
			status: {
				code: 200
			},
			body: {
				type: type,
				stream: resource.read(jsh.io.Streams.binary)
			}
		};
	} else {
		return {
			status: {
				code: 404
			}
		};
	}
}
