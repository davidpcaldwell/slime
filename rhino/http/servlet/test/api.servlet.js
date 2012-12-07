$exports.handle = function() {
	return httpd.http.Response.text(Boolean(httpd.js && httpd.java) && typeof(httpd.js.Object) == "object" && typeof(httpd.io.java.adapt) == "function");
}