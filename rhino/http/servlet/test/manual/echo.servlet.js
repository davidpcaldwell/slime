$exports.handle = function(request) {
	var lines = [];
	lines.push("Requested path: [" + request.path + "]");
	return httpd.http.Response.text(lines.join("\n"));
};