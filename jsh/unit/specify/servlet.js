var loader = new jsh.file.Loader({ directory: jsh.file.Pathname("/").directory });

$exports.handle = function(request) {
	if (request.path == "") request.path = "index.html";
	if (request.path == "pathname") {
		return {
			status: { code: 200 },
			body: {
				string: $parameters.api.toString()
			}
		}
	}
	if ($loader.get(request.path)) {
		return {
			status: { code: 200 },
			body: $loader.get(request.path)
		}
	}
	var filesystem = /^filesystem\/(.*)/
	var match = filesystem.exec(request.path);
	if (match) {
		var rv = loader.get(match[1]);
		if (rv) {
			return {
				status: { code: 200 },
				body: rv
			};
		}
	}
};
