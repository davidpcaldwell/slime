var parameters = jsh.script.getopts({
	options: {
		base: jsh.file.Pathname,
		index: "README.html",
		host: "documentation"
	}
});

jsh.shell.jsh.require({
	satisfied: function() {
		return jsh.httpd.Tomcat;
	},
	install: function() {
		jsh.shell.tools.tomcat.install();
	}
});

var base = parameters.options.base.directory;

var server = jsh.httpd.Tomcat.serve({
	directory: base
});

//	Use dedicated Chrome browser if present
if (jsh.shell.browser.chrome) {
	var pac = jsh.shell.jsh.src.getFile("rhino/ui/application-hostToPort.pac").read(String)
		.replace(/__HOST__/g, parameters.options.host)
		.replace(/__PORT__/g, String(server.port))
	;
	var instance = new jsh.shell.browser.chrome.Instance({
		location: base.getRelativePath("local/chrome/documentation"),
		proxy: new jsh.shell.browser.ProxyConfiguration({
			code: pac
		})
	});
	instance.run({
		uri: "http://" + parameters.options.host + "/" + parameters.options.path
	});
} else {
	//	Otherwise, fall back to Java desktop integration and default browser
	Packages.java.awt.Desktop.getDesktop().browse( new Packages.java.net.URI( "http://127.0.0.1:" + server.port + "/" + parameters.options.path ) );
}
server.run();
