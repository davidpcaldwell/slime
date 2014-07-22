var tomcat = new jsh.httpd.Tomcat({});
tomcat.map({
	path: "/",
	servlets: {
		"/*": {
			file: jsh.script.file.getRelativePath("file.servlet.js").file,
			parameters: {
				base: jsh.script.file.parent.parent.parent.parent.toString()
			}
		}
	}
});
tomcat.start();

jsh.shell.echo("Running on " + tomcat.port);

var client = new jsh.http.Client();
var url = "http://127.0.0.1:" + tomcat.port + "/jsh/test/jsh.script/loader.jsh.js";
var code = client.request({
	url: url
});
jsh.shell.echo(code.body.stream.character().asString());
jsh.shell.run({
	command: jsh.shell.java.launcher,
	arguments: ["-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar")].concat(url)
});
jsh.shell.echo("Success launching URL script: " + url);
