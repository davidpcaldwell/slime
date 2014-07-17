//	TODO	is there a better way in our error framework?
var newError = function(p) {
	var e = new Error();
	for (var x in p) {
		e[x] = p[x];
	}
	return e;
}

$exports.Application = function(o) {
	var toFunction = function(command) {
		if (command.getopts) {
			return function(globals) {
				var parameters = $context.getopts(command.getopts, globals.arguments);
				return command.run.call(this,
					$context.js.Object.set(
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
			throw newError({ usage: true });
		}

		var command = globals.arguments.shift();
		var object = eval("o.commands." + command);
		if (typeof(object) != "object" || !object) {
			throw newError({ commandNotFound: command });
		}
		return toFunction(object).call(o, { options: globals.options, arguments: globals.arguments });
	};
};
$exports.Application.run = function(descriptor) {
	try {
		return new Application(descriptor).run($context.arguments);
	} catch (e) {
		if (e.usage) {
			jsh.shell.echo("Usage: " + jsh.script.file + " <command> [arguments]");			
			jsh.shell.exit(1);
		} else if (e.commandNotFound) {
			jsh.shell.echo("Command not found: " + e.commandNotFound);			
			jsh.shell.exit(1);			
		}
	}
}