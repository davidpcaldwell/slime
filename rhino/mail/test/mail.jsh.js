var parameters = jsh.script.getopts({
	options: {
		from: String,
		to: String,
		user: String,
		password: String,
		gmail: false,
		properties: jsh.file.Pathname
	}
});

jsh.shell.echo("jsh.mail = " + jsh.mail);
jsh.shell.echo("jsh.mail.Session = " + jsh.mail.Session);

if (!parameters.options.gmail) {
	jsh.shell.echo("Unimplemented: non-Gmail test");
	jsh.shell.exit(1);
}

if (parameters.options.gmail && parameters.options.properties) {
	jsh.shell.echo("Properties ignored; using Gmail");
}

var from = (parameters.options.gmail) ? parameters.options.user : parameters.options.from;
var to = (parameters.options.to) ? parameters.options.to : from;

var message = {
	subject: "Subject",
	text: "Hello, World!",
	from: from,
	to: [to]
};

var session = new jsh.mail.Session({
	_properties: jsh.mail.Session._properties.GMAIL,
	credentials: {
		user: parameters.options.user,
		password: parameters.options.password
	}
});
session.send(message);

session.send({
	subject: "HTML message",
	text: "Hello, Text!",
	html: "Hello, <strong>HTML</strong>!",
	from: from,
	to: [to]
});

session.send({
	subject: "HTML only with attachments",
	html: "Hello, <strong>HTML</strong>!",
	from: from,
	to: [to],
	attachments: [
		{
			type: new jsh.io.mime.Type("text", "plain"),
			stream: jsh.script.file.pathname.file.read(jsh.io.Streams.binary),
			filename: "script-running.jsh.js",
			disposition: "attachment"
		}
	]
});

session.send({
	subject: "Text and HTML with attachments",
	text: "Hello, text!",
	html: "Hello, <strong>HTML</strong>!",
	from: from,
	to: [to],
	attachments: [
		{
			type: new jsh.io.mime.Type("text", "plain"),
			stream: jsh.script.file.pathname.file.read(jsh.io.Streams.binary),
			filename: "script-running.jsh.js",
			disposition: "attachment"
		}
	]
});
