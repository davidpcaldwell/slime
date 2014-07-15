$exports.Application = function(o) {
	var toFunction = function(command) {
		if (command.getopts) {
			return function(globals) {
				var parameters = $context.getopts(command.getopts, globals.arguments);
				return command.run.call(this,
					jsh.js.Object.set(
						{},
						{
							global: globals.options
						}, parameters
					)
				);
			}
		} else {
			throw new Error("Unsupported format: lacking getopts/command");
		}
	};

	this.run = function() {
		var globals = $context.getopts({
			options: o.options,
			unhandled: $context.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		}, arguments);

		if (globals.arguments.length == 0) {
			jsh.shell.echo("Usage: " + jsh.script.file + " <command> [arguments]");
			jsh.shell.exit(1);
		}

		var command = globals.arguments.shift();
		var object = eval("o.commands." + command);
		if (typeof(object) != "object" || !object) {
			jsh.shell.echo("Command not found: " + command);
			jsh.shell.exit(1);
		}
		return toFunction(object).call(o, { options: globals.options, arguments: globals.arguments });
	};
};
