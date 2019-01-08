var server = jsh.httpd.Tomcat.serve({
	directory: jsh.shell.jsh.src
});
server.start();
jsh.java.Thread.start(function() {
	server.run();
});
var browser = new jsh.shell.browser.chrome.Instance({
	location: jsh.shell.jsh.src.getRelativePath("local/chrome/test")
});
browser.run({
	uri: "http://127.0.0.1:" + server.port + "/" + "loader/browser/test/test/nested.html"
});
