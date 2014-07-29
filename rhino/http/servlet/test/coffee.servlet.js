var coffee = httpd.loader.module("WEB-INF/coffee/module.coffee");
var cup = httpd.loader.module("WEB-INF/coffee/loader.js");

$exports.handle = function(request) {
	if (request.path == "coffee/a") {
		return httpd.http.Response.text(String(coffee.a));
	}
	if (request.path == "cup/file/b") {
		return httpd.http.Response.text(String(cup.file.b));
	}
};
