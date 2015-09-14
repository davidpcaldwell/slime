jsh.shell.echo("Just a skeleton, does not do anything useful currently.", { stream: jsh.shell.stdio.error });
jsh.shell.exit(1);
var operation = jsh.script.arguments[0];

var input = {};
jsh.shell.stdio.input.character().readLines(function(line) {
	var tokens = line.split("=");
	input[tokens[0]] = tokens.slice(1).join("=");
});

if (operation == "get") {
	if (!input.user) {
//		input.user = jsh.java.tools.askpass.gui({
//			nomask: true,
//			prompt: "Enter username for " + input.host
//		});
	}
//	input.password = jsh.java.tools.askpass.gui({
//		prompt: "Enter password for " + input.user + "@" + input.host
//	});
	for (var x in input) {
		jsh.shell.echo(x + "=" + input[x]);
	}
	jsh.shell.echo();
}