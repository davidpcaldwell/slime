$exports.handle = function(request) {
	Packages.java.lang.System.err.println("path = " + request.path);
	if (request.path == "") request.path = "index.html";
	var rv = $loader.get(request.path);
	if (rv) {
		return {
			status: { code: 200 },
			body: rv
		}
	}
};
