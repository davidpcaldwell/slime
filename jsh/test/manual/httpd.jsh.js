var tomcat = new jsh.httpd.Tomcat({
	script: jsh.script.getRelativePath("httpd.servlet.js")
});
jsh.shell.echo("Tomcat port: " + tomcat.port);
var client = new jsh.http.Client();
var response = client.request({
	url: "http://127.0.0.1:" + tomcat.port + "/"
});
if (!/^text\/plain/.test(response.body.type)) {
	jsh.shell.echo("Type = " + response.body.type);
	jsh.shell.exit(1);
}
var string = response.body.stream.character().asString();
if (string != "Hello, World!") {
	jsh.shell.echo("string = " + string);
	jsh.shell.exit(1);
};
jsh.shell.echo("Success! " + jsh.script.file);
jsh.shell.exit(0);
