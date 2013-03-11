var multipart = new jsh.io.mime.Multipart({
	subtype: "alternative",
	parts: [
		{
			type: new jsh.io.mime.Type("text", "plain"),
			string: "Hello, World"
		},
		{
			type: new jsh.io.mime.Type("text", "html"),
			string: "<html><body>Hello, World</body></html>",
			filename: "second",
			disposition: "attachment"
		}
	]
});

jsh.io.Streams.binary.copy(multipart.read.binary(), jsh.shell.stdout);

jsh.shell.echo("MIME type for index.html = " + jsh.io.mime.Type.guess({ name: "index.html" }));
