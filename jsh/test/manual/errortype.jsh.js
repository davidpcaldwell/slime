var Unimplemented = jsh.js.Error.Type("Unimplemented");

try {
	throw new Unimplemented("Not implemented.");
} catch (e) {
	jsh.shell.echo("toString: " + e.toString());
	jsh.shell.echo("Error?: " + Boolean(e instanceof Error));
	jsh.shell.echo("Unimplemented?: " + Boolean(e instanceof Unimplemented));
	jsh.shell.echo("name: " + e.name);
	jsh.shell.echo("message: " + e.message);
	jsh.shell.echo("stack: " + e.stack);
}

