var slime = new jsh.file.Loader({ directory: $parameters.slime });
var loader = new jsh.file.Loader({ directory: jsh.file.Pathname("/").directory });

$exports.handle = function(request) {
	if (request.path == "") {
		return {
			status: { code: 200 },
			body: {
				string: JSON.stringify({
					api: $parameters.api.toString(),
					debug: $parameters.debug
				},void(0),"    ")
			}
		}
	}
	
	if (request.path == "$reload") {
		if ($parameters.debug) httpd.$reload();
		return {
			status: { code: 200 },
			body: {
				string: ($parameters.debug) ? "Reloaded." : "Not reloaded; debug = " + $parameters.debug
			}
		};
	}
	
	if (request.path == "favicon.ico") {
		return {
			status: { code: 404 }
		}
	}
	
	if ($loader.get(request.path)) {
		return {
			status: { code: 200 },
			body: $loader.get(request.path)
		}
	}

	var slimeMatcher = /^slime\/(.*)/;
	var slimeMatch = slimeMatcher.exec(request.path);
	if (slimeMatch) {
		var rv = slime.get(slimeMatch[1]);
		if (rv) {
			return {
				status: { code: 200 },
				body: rv
			};
		} else {
			return {
				status: { code: 404 }
			}
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
		} else {
			return {
				status: { code: 200 },
				body: {
					type: "text/html",
					string: $parameters.slime.getFile("loader/api/api.template.html").read(String)
				}
			}
		}
	}
};
